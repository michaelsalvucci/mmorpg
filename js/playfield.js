$(document).ready(function() {


  $('#backpack').hide();
  $('#chat').hide();
  $('#debug').hide();
  $('#email').hide();
  $('#login').hide();

  $('#map').hide();
  $('#map').draggable();

  $('#paperdoll').hide();
  $('#trade').hide();

  $('textarea#menu').keyup(function(event) {
    var code = event.keyCode || event.which;

    if(code == 66 || code == 98) {  // b or B key pressed
      $("#backpack").toggle();  // simply toggles the visibility of the element
    }

    if(code == 67 || code == 99) {  // c or C key pressed
      $("#chat").toggle();  // simply toggles the visibility of the element
    }

    if(code == 68 || code == 100) {  // d or D key pressed
      $("#debug").toggle();  // simply toggles the visibility of the element
    }

    if(code == 69 || code == 101) {  // e or E key pressed
      $("#email").toggle();  // simply toggles the visibility of the element
    }

    if(code == 76 || code == 108) {  // l or L key pressed
      $("#login").toggle();  // simply toggles the visibility of the element
    }

    if(code == 77 || code == 109) {  // m or M key pressed
      $("#map").toggle();  // simply toggles the visibility of the element
    }

    if(code == 80 || code == 112) {  // p or P key pressed
      $("#paperdoll").toggle();  // simply toggles the visibility of the element
    }

    if(code == 84 || code == 116) {  // b or B key pressed
      $("#trade").toggle();  // simply toggles the visibility of the element
    }

    $('textarea#menu').val(''); // flush
  });

});

function helloworld() {
  alert('hereiam');
}

function test2() {
  alert('test2');
}
