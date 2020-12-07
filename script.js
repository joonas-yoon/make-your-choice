$(document).ready(function(){
  const mainContainer = document.getElementById('main');

  let hud = {
    /* variables */
    container: document.getElementById('hud'),
    /* functions */
    init: function() {
      var inven = document.createElement('ul');
      inven.id = 'inventory';
      this.container.innerHTML = '';
      this.container.appendChild(inven);
    },
    updateInventory: function (items) {
      items = items || {};
      let inven = this.container.querySelector('#inventory');
      inven.innerHTML = '';
      var keys = Object.keys(items).sort(function(a, b) { return items[a] - items[b]; });
      console.log(items);
      for (let i = 0; i < keys.length; ++i) {
        let value = items[keys[i]];
        if (value == 0) continue;
        let item = document.createElement('li');
        let absv = Math.abs(value);
        if (value < 0) {
          item.className = 'negative';
        }
        item.innerText = (value < 0 ? '-':'+') + ' ' + keys[i] + (absv > 1 ? ': ' + absv : '');
        inven.appendChild(item);
      }
    }
  };

  let player = {
    /* variables */
    items : {},
    /* functions */
    init: function() {
      this.items = {};
    },
    hasCondition: function(condition) {
      function cmp(oper, a, b) {
        if (oper == 'eq') return a == b;
        else if (oper == 'ne') return a != b;
        else if (oper == 'gt') return a > b;
        else if (oper == 'ge') return a >= b;
        else if (oper == 'lt') return a < b;
        else if (oper == 'le') return a <= b;
        return false;
      }
      // player.items has all items on condition?
      condition = condition || [];
      for (let i = 0; i < condition.length; ++i) {
        let c = condition[i]; // [name, oper, value]
        let name = c[0], x = this.items[name] || 0;
        if (cmp(c[1], x, c[2]) == false) return false;
      }
      return true;
    },
    saveItems: function(newItems) {
      newItems = newItems || {};
      let keys = Object.keys(newItems);
      for (let i = 0; i < keys.length; ++i) {
        let name = keys[i];
        let value = newItems[name] || 0;
        this.items[name] = (this.items[name] || 0) + value;
        let vtext = Math.abs(value) > 1 ? ' (' + Number(Math.abs(value).toFixed(0)).toLocaleString() + ')' : '';
        if (value > 0) {
          $('body').toast({
            class: 'green',
            position: 'bottom left',
            message: '<b>' + name + '</b>을(를) 얻었다.' + vtext,
            showProgress: 'bottom',
            displayTime: 5 * 1000
          });
        } else {
          $('body').toast({
            class: 'red',
            position: 'bottom left',
            message: '<b>' + name + '</b>을(를) 잃었다.' + vtext,
            showProgress: 'bottom',
            displayTime: 5 * 1000
          });
        }
      }
      hud.updateInventory(this.items);
    }
  };

  let button = {
    /* variables */
    el: undefined,
    $el: undefined,
    /* functions */
    setElement: function(el) {
      this.el = el;
      this.$el = $(el);
      return this.el;
    },
    setText: function(text) {
      this.$el.text(text);
    },
    enable: function(boolean) {
      if (boolean) this.$el.removeAttr('disabled');
      else this.$el.attr('disabled', 1);
    },
    focus: function(opt) {
      opt = opt || {behavior: 'smooth'};
      this.el.scrollIntoView(opt);
    }
  };

  let paginator = {
    /* variables */
    json: {},
    lastPageElement : undefined,
    currentPage: undefined,
    currentLine: undefined,
    lastLine: undefined,
    link: undefined,
    metadata: undefined,
    /* functions */
    init: function() {
      this.json = {};
      this.lastPageElement = undefined;
      this.currentPage = undefined;
      this.currentLine = undefined;
      this.lastLine = undefined;
      this.link = undefined;
      this.metadata = undefined;
      mainContainer.innerHTML = '';
      $('#btnRestart').hide();
    },
    endGame: function() {
      setTimeout(function(){
        $('#endModal').modal('show');
      }, 5 * 1000);
    },
    showNextPage: function() {
      $('#p' + this.currentPage).removeClass('active');
      $('#p' + this.currentPage).addClass('history');
      $('.history .item').each(function(idx, item) {
        item.removeEventListener('click', selectChoiceEvent);
      });

      if (this.metadata) {
        player.saveItems(this.metadata.get);
        this.metadata = undefined;
      }

      if (this.link === 'end') {
        button.enable(false);
        button.setText('끝');
        this.endGame();
      } else {
        var self = this;
        this.createPage(this.link, function(el){
          self.showPage(el);
          button.focus();
        });
      }
    },
    showNextLine: function() {
      this.currentLine += 1;
      var $line = $('#' + this.lastPageElement.id + '-' + this.currentLine);
      if ($line.hasClass('choice')) {
        $line.css('display', 'flex').hide().fadeIn();
        button.enable(false);
        button.setText('선택하기');
      }
      else {
        button.enable(true);
        button.setText(this.currentLine == this.lastLine ? '다음' : '계속');
        $line.fadeIn();
      }
      button.focus();
    },
    isAllRead: function() {
      return (this.currentLine || 0) >= (this.lastLine || 0);
    },
    showPage: function(el) {
      var $el = $(el);
      this.currentPage = $el.attr('id').substr(1);
      this.currentLine = 1;
      $el.addClass('active').fadeIn();
      $($el.children()[0]).fadeIn();
      button.enable(this.lastPageElement.getAttribute('choice') && this.lastPageElement.childElementCount == 1 ? false : true);
      button.setText('계속');
    },
    createPage: function(page, callback) {
      var data = this.json.stories[page];
      var sentences = data.sentences || [];

      // Get and Set next link
      paginator.link = data.next || 'end'; // nothing to next, end game. (default ending)
      paginator.lastLine = sentences.length || 0;
      if (data.end) {
        paginator.link = 'end';
      }

      // Theme
      if (data.theme) { // custom
        document.body.className = data.theme;
      } else if (this.json.theme) { // default
        document.body.className = this.json.theme;
      } else { // none
        document.body.className = '';
      }

      // Get Items
      if (data.get) {
        player.saveItems(data.get);
        data.get = undefined;
      }

      // Create html element
      var el = document.createElement('div');
      el.className = 'ui very padded segment';
      el.id = 'page-' + Math.random().toString(36).substr(2);
      el.setAttribute('prev', paginator.lastPageElement ? paginator.lastPageElement.id : '');
      el.setAttribute('page', page);
      paginator.lastPageElement = el;

      for (var i=0; i < sentences.length; ++i) {
        let p = document.createElement('p');
        p.innerText = sentences[i];
        p.id = el.id + '-' + (i+1);
        p.style.display = 'none';
        el.appendChild(p);
      }

      if (!!data.choice) {
        paginator.lastLine += 1;
        var choiceBox = createChoiceBox(data.choice);
        choiceBox.id = el.id + '-' + paginator.lastLine;
        // No option for select, then pass to next as default
        if (choiceBox.childElementCount == 0) {
          paginator.link = data.next || 'end';
          paginator.metadata = data;
          paginator.lastLine -= 1;
        } else {
          el.appendChild(choiceBox);
          el.setAttribute('choice', true);
        }
      } else {
        paginator.metadata = data;
      }

      mainContainer.appendChild(el);

      callback(el);
    }
  };

  function selectChoiceEvent(evt) {
    evt.preventDefault();
    var el = evt.target;
    var next = el.getAttribute('next');
    $(el.parentNode.parentNode).find('.item').removeClass('active');
    paginator.link = next;
    paginator.metadata = evt.target.meta;
    button.enable(true);
    button.setText(el.innerText);
    el.classList.add('active');
    button.focus();
  }

  function createChoiceBox(choice) {
    var row = document.createElement('div');
    row.className = 'ui stackable two column grid choice';
    for (var i=0; i < choice.length; ++i) {
      if (!player.hasCondition(choice[i].condition)) continue;
      let col = document.createElement('div');
      col.className = 'column';
      let item = document.createElement('div');
      item.className = 'item';
      item.innerText = choice[i].title;
      item.setAttribute('next', choice[i].next);
      item.addEventListener('click', selectChoiceEvent);
      item.meta = {
        get: choice[i].get || {},
        condition: choice[i].condition || {}
      };
      col.appendChild(item);
      row.appendChild(col);
    }
    return row;
  }

  $(button.setElement(document.getElementById('btnAction'))).on('click', function(evt) {
    evt.preventDefault();
    if (paginator.isAllRead()) {
      paginator.showNextPage();
    } else {
      paginator.showNextLine();
    }
    evt.target.scrollIntoView({behavior: 'smooth'});
  });

  function startGame(){
    $.ajax({
      url: './1.json',
      cache: false,
      dataType: 'json',
      async: false,
      success: function(data) {
        startGameWithJson(data);
      },
      // complete: console.log,
      error: console.error
    });
  }

  function startGameWithJson(json) {
    paginator.json = json;
    paginator.createPage(json.start, function(el){
      paginator.showPage(el);
    });
  }

  function readyGame() {
    hud.init();
    player.init();
    paginator.init();

    var j = new URL(window.location.href).searchParams.get('j');
    if (j != undefined && JSON.parse(j)) {
      startGameWithJson(JSON.parse(j));
    } else {
      startGame();
    }
  }
  
  readyGame();

  $('#btnRestart').on('click', readyGame);
  $('#endModal .restart.button').on('click', function(evt){
    this.parentElement.querySelector('.close.button').click();
    readyGame();
  });
  $('#endModal .close.button').on('click', function(evt){
    $('#btnRestart').show();
    $('#endModal').modal('hide');
  });

  $('#hud').on('click', function(evt){
    this.classList.toggle('inactive');
  });
});