$(document).ready(function(){
  const mainContainer = document.getElementById('main');

  let hud = {
    /* variables */
    container: document.getElementById('hud'),
    /* functions */
    updateInventory: function (items) {
      items = items || {};
      let inven = this.container.querySelector('#inventory');
      inven.innerHTML = '';
      var keys = Object.keys(items);
      console.log(items);
      for (let i = 0; i < keys.length; ++i) {
        let value = items[keys[i]];
        if (value == 0) continue;
        let item = document.createElement('li');
        if (value < 0) item.className = 'negative';
        item.innerText = keys[i] + ': ' + value;
        inven.appendChild(item);
      }
    }
  };

  let player = {
    /* variables */
    items : {},
    /* functions */
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
        let name = c[0], x = this.items[name];
        // skip if player does not have it
        if (x === undefined) return false;
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
        if (value > 0) {
          $('body').toast({
            class: 'green',
            message: 'You\'ve got <b>' + name + '</b>: ' + value,
            showProgress: 'bottom',
            displayTime: 10 * 1000
          });
        } else {
          $('body').toast({
            class: 'red',
            message: 'You\'ve lost <b>' + name + '</b>: ' + value,
            showProgress: 'bottom',
            displayTime: 10 * 1000
          });
        }
      }
      hud.updateInventory(this.items);
    }
  };

  let button = {
    /* variables */
    $el: undefined,
    /* functions */
    setElement: function(el) {
      this.$el = el;
      return this.$el;
    },
    setText: function(text) {
      this.$el.text(text);
    },
    enable: function(boolean) {
      if (boolean) this.$el.removeAttr('disabled');
      else this.$el.attr('disabled', 1);
    }
  };

  let paginator = {
    /* variables */
    json: {},
    currentPage: undefined,
    currentLine: undefined,
    lastLine: undefined,
    link: undefined,
    metadata: undefined,
    /* functions */
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
        button.setText('- The End -');
      } else {
        var self = this;
        this.createPage(this.link, function(el){
          self.showPage(el);
        });
      }
    },
    showNextLine: function() {
      this.currentLine += 1;
      var $line = $('#p' + this.currentPage + '-' + this.currentLine);
      if ($line.hasClass('choice')) {
        $line.css('display', 'flex').hide().fadeIn();
        button.enable(false);
        button.setText('Select');
      }
      else {
        button.enable(true);
        button.setText(this.currentLine == this.lastLine ? 'Next' : 'Continue');
        $line.fadeIn();
      }
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
      button.enable(true);
      button.setText('Continue');
    },
    createPage: function(page, callback) {
      var data = this.json.stories[page];

      // Get and Set next link
      paginator.link = data.next;
      paginator.lastLine = data.sentences.length || 0;
      if (data.end) {
        paginator.link = 'end';
      }


      // Create html element
      var el = document.createElement('div');
      el.className = 'ui very padded segment';
      el.id = '#' + page;

      for (var i=0; i < data.sentences.length; ++i) {
        let p = document.createElement('p');
        p.innerText = data.sentences[i];
        p.id = 'p' + page + '-' + (i+1);
        p.style.display = 'none';
        el.appendChild(p);
      }

      if (!!data.choice) {
        paginator.lastLine += 1;
        el.setAttribute('choice', true);
        var choiceBox = createChoiceBox(data.choice);
        choiceBox.id = 'p' + page + '-' + paginator.lastLine;
        el.appendChild(choiceBox);
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

  button.setElement($('#btnAction')).on('click', function(evt) {
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
      success: function(json) {
        paginator.json = json;
        paginator.createPage(json.start, function(el){
          paginator.showPage(el);
        });
      },
      // complete: console.log,
      error: console.error
    });
  }

  startGame();
});