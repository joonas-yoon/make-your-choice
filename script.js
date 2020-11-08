$(document).ready(function(){
  const main_container = document.getElementById('main');
  const action_container = document.getElementById('actions');
  const $button = $("#btn_action");

  let state = {
    story: 1, line: 1, history: [1], prev_story: {}
  };

  function get_sample_story(id, callback){
    $.getJSON('./1.json', function(data) {
      callback(data.stories[id])
    });
  }

  function create_box_story(story) {
    var el = document.createElement('div');
    el.className = 'container';
    el.style.display = 'none';
    el.id = 's' + state.story;
    el.setAttribute('lcount', story.sentences.length);
    main_container.appendChild(el);
    for (var i=0; i < story.sentences.length; ++i) {
      let p = document.createElement('p');
      p.innerText = story.sentences[i];
      p.id = 's' + state.story + '-l' + (i+1);
      p.style.display = 'none';
      el.appendChild(p);
    }

    if (!!story.choice) {
      el.setAttribute('choice', true);
      el.appendChild(create_choice(story.choice));
    }
  }

  function create_choice(choice) {
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

  function button_click_event(evt){
    evt.preventDefault();
    if (state.line == 1) {
      $('#s' + (state.history[state.history.length - 1])).addClass('history').removeClass('active');
      $('#s' + state.story).show().addClass('active');
    }
    var $el = $('#s' + state.story + '-l' + state.line);
    $el.fadeIn();
    var is_read_all = state.line >= $el.parent().attr('lcount');
    if (is_read_all) {
      evt.target.innerText = 'Next';
      state.story = prev_story.next;
      state.line = 1;
      state.history.push(prev_story.next);
      get_sample_story(prev_story.next, function(data) {
        console.log(prev_story.next, data);
        prev_story = data;
        create_box_story(data);
      });
    } else {
      console.log(document.getElementById('s' + state.story));
      evt.target.innerText = 'Continue';
      state.line += 1;
    }
    evt.target.scrollIntoView();
  }

  get_sample_story(state.story, function(data) {
    prev_story = data;
    create_box_story(data);
  });

  $button.on('click', button_click_event);
});