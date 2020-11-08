$(document).ready(function(){
  const main_container = document.getElementById('main');

  let paginator = {
    /* variables */
    currentPage: undefined,
    currentLine: undefined,
    maxLine: undefined,
    link: undefined,
    /* functions */
    showNextPage: function() {
      $('#p' + this.currentPage).removeClass('active');
      $('#p' + this.currentPage).addClass('history');
      this.createPage(this.link);
      this.showPage(this.link);
    },
    showNextLine: function() {
      this.currentLine += 1;
      var $line = $('#p' + this.currentPage + '-' + this.currentLine);
      if ($line.hasClass('choice')) $line.css('display', 'flex').hide().fadeIn();
      else $line.fadeIn();
      console.log('nextLine', this);
    },
    isAllRead: function() {
      return (this.currentLine || 0) >= (this.maxLine || 0);
    },
    showPage: function(page) {
      this.currentPage = page;
      this.currentLine = 1;
      console.log('showPage', this);
      setTimeout(function(){
        $('#p' + page).addClass('active');
        $('#p' + page).fadeIn();
        $('#p' + page + '-1').fadeIn();
      }, 10);
    },
    createPage: function(page) {
      getSampleStory(page, function(data) {
        // Get and Set next link
        paginator.link = data.next;
        paginator.maxLine = data.sentences.length || 0;

        // Create html element
        var el = document.createElement('div');
        el.className = 'container';
        el.style.display = 'none';
        el.id = 'p' + page;
        el.setAttribute('lcount', data.sentences.length);

        for (var i=0; i < data.sentences.length; ++i) {
          let p = document.createElement('p');
          p.innerText = data.sentences[i];
          p.id = 'p' + page + '-' + (i+1);
          p.style.display = 'none';
          el.appendChild(p);
        }

        if (!!data.choice) {
          paginator.maxLine += 1;
          el.setAttribute('choice', true);
          var choiceBox = createChoiceBox(data.choice);
          choiceBox.id = 'p' + page + '-' + (data.sentences.length+1);
          el.appendChild(choiceBox);
        }

        main_container.appendChild(el);
      });
    }
  };
  
  // After load
  setTimeout(function(){
    paginator.createPage(1);
    paginator.showPage(1);
  }, 100);

  $('#btn_action').on('click', function(evt) {
    evt.preventDefault();
    console.log(paginator);
    if (paginator.isAllRead()) {
      paginator.showNextPage();
    } else {
      paginator.showNextLine();
    }
  });

  function getSampleStory(id, callback){
    $.getJSON('./1.json', function(data) {
      callback(data.stories[id]);
    });
  }

  function createChoiceBox(choice) {
    var row = document.createElement('div');
    row.className = 'row choice';
    for (var i=0; i < choice.length; ++i) {
      let col = document.createElement('div');
      col.className = 'col-12 col-sm-6';
      let item = document.createElement('div');
      item.className = 'item';
      item.innerText = choice[i].title;
      col.append(item);
      row.appendChild(col);
    }
    return row;
  }
});