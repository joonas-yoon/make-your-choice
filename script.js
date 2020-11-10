$(document).ready(function(){
  const main_container = document.getElementById('main');

  let player = {
    /* variables */
    items : {},
    /* functions */
    hasCondition: function(condition) {
      // player.items has all items on condition?
      condition = condition || {};
      let keys = Object.keys(condition);
      for (let i=0; i < keys.length; ++i){
        if (this.items[keys[i]] === undefined) return false;
        if (this.items[keys[i]] < condition[keys[i]]) return false;
      }
      return true;
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
    currentPage: undefined,
    currentLine: undefined,
    lastLine: undefined,
    link: undefined,
    /* functions */
    showNextPage: function() {
      $('#p' + this.currentPage).removeClass('active');
      $('#p' + this.currentPage).addClass('history');
      $('.history .item').each(function(idx, item) {
        item.removeEventListener('click', selectChoiceEvent);
      });
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
      getSampleStory(page, function(data) {
        // Get and Set next link
        paginator.link = data.next;
        paginator.lastLine = data.sentences.length || 0;
        if (data.end) {
          paginator.link = 'end';
        }

        // Create html element
        var el = document.createElement('div');
        el.className = 'container';
        el.id = 'p' + page;

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
        }

        main_container.appendChild(el);

        callback(el);
      });
    }
  };

  function getSampleStory(id, callback){
    $.ajax({
      url: './1.json',
      cache: false,
      dataType: 'json',
      async: false,
      success: function(data) {
        callback(data.stories[id]);
      },
      // complete: console.log,
      error: console.error
    });
  }

  function selectChoiceEvent(evt) {
    evt.preventDefault();
    var el = evt.target;
    var next = el.getAttribute('next');
    $(el.parentNode.parentNode).find('.item').removeClass('active');
    paginator.link = next;
    button.enable(true);
    button.setText(el.innerText);
    el.classList.add('active');
  }

  function createChoiceBox(choice) {
    var row = document.createElement('div');
    row.className = 'row choice';
    for (var i=0; i < choice.length; ++i) {
      if (!player.hasCondition(choice[i].condition)) continue;
      let col = document.createElement('div');
      col.className = 'col-12 col-sm-6';
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

  button.setElement($('#btn_action')).on('click', function(evt) {
    evt.preventDefault();
    if (paginator.isAllRead()) {
      paginator.showNextPage();
    } else {
      paginator.showNextLine();
    }
  });
  
  // After load
  paginator.createPage(1, function(el){
    paginator.showPage(el);
  });
});