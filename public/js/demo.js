/**
 * Copyright 2014, 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*global $:false, SPEECH_SYNTHESIS_VOICES */

'use strict';

$(document).ready(function() {

  function showError(msg) {
    console.error('Error: ', msg);
    var errorAlert = $('.error-row');
    errorAlert.css('visibility','hidden');
    errorAlert.css('background-color', '#d74108');
    errorAlert.css('color', 'white');
    var errorMessage = $('#errorMessage');
    errorMessage.text(msg);
    errorAlert.css('visibility','');

    $('#errorClose').click(function(e) {
      e.preventDefault();
      errorAlert.css('visibility','hidden');
      return false;
    });
  }

  function synthesizeRequest(options, audio) {
    var sessionPermissions = JSON.parse(localStorage.getItem('sessionPermissions')) ? 0 : 1;
    var downloadURL = '/api/synthesize' +
      '?voice=' + options.voice +
      '&text=' + encodeURIComponent(options.text) +
      '&X-WDC-PL-OPT-OUT=' +  sessionPermissions;

    if (options.download) {
      downloadURL += '&download=true';
      window.location.href = downloadURL;
      return true;
    }
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch(ex) {
      // ignore. Firefox just freaks out here for no apparent reason.
    }
    audio.src = downloadURL;
    audio.play();
    return true;
  }

  // Global comes from file constants.js
  var voices = SPEECH_SYNTHESIS_VOICES.voices;
  showVoices(voices);

  var voice = 'en-US_MichaelVoice';

  function showVoices(voices) {

    var currentTab = 'Text';

    // Show tabs
    $('#nav-tabs a').click(function (e) {
      e.preventDefault();
      $(this).tab('show');
    });

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
      currentTab = $(e.target).text();
    });

    var LANGUAGE_TABLE = {
      'en-US': 'English (en-US)',
      'en-GB': 'English (en-GB)',
      'ja-JP': 'Japanese (ja-JP)',
      'es-US': 'Spanish (es-US)',
      'de-DE': 'German (de-DE)',
      'fr-FR': 'French (fr-FR)',
      'it-IT': 'Italian (it-IT)',
      'es-ES': 'Spanish (es-ES)'
    };

    $.each(voices, function(idx, voice) {
      var voiceName = voice.name.substring(6, voice.name.length - 5);
      var optionText = LANGUAGE_TABLE[voice.language] + ': ' + voiceName + ' ('  + voice.gender + ')';
      $('#dropdownMenuList').append(
        $('<li>')
        .attr('role', 'presentation')
        .append(
          $('<a>').attr('role', 'menu-item')
          .attr('href', '/')
          .attr('data-voice', voice.name)
          .append(optionText)
          )
        );
    });

    var audio = $('.audio').get(0),
        textArea = $('#textArea');

    var textChanged = false;

    $('#textArea').val(englishText);
    $('#ssmlArea').val(englishSSML);

    $('#textArea').change(function(){
      textChanged = true;
    });

    $('#dropdownMenuList').click(function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var newVoiceDescription = $(evt.target).text();
      voice = $(evt.target).data('voice');
      $('#dropdownMenuDefault').empty().text(newVoiceDescription);
      $('#dropdownMenu1').dropdown('toggle');

      var lang = voice.substring(0, 2);
        switch(lang) {
          case 'es':
            $('#textArea').val(spanishText);
            $('#ssmlArea').val(spanishSSML);
            break;
          case 'fr':
            $('#textArea').val(frenchText);
            $('#ssmlArea').val(frenchSSML);
            break;
          case 'de':
            $('#textArea').val(germanText);
            $('#ssmlArea').val(germanSSML);
            break;
          case 'it':
            $('#textArea').val(italianText);
            $('#ssmlArea').val(italianSSML);
            break;
          case 'ja':
            $('#textArea').val(japaneseText);
            $('#ssmlArea').val(japaneseSSML);
            break;
          default:
            $('#textArea').val(englishText);
            $('#ssmlArea').val(englishSSML);
            break;
        }
    });

    // IE and Safari not supported disabled Speak button
    if ($('body').hasClass('ie') || $('body').hasClass('safari')) {
      $('.speak-button').prop('disabled', true);
    }

    if ($('.speak-button').prop('disabled')) {
      $('.ie-speak .arrow-box').show();
    }

    $('.audio').on('error', function (err) {
      console.log(err);
      $.get('/ping').always(function (response) {
        var error =  'Error processing the request';
        if (response.responseJSON && response.responseJSON.error) {
          error = response.responseJSON.error;
        }
          showError(error);
      });
    });

    $('.audio').on('loadeddata', function () {
      $('.result').show();
      $('.error-row').css('visibility','hidden');
    });

    $('.download-button').click(function() {
      textArea.focus();
      if (validText(voice, textArea.val())) {
        var utteranceDownloadOptions = {
          text: currentTab === 'SSML' ? $('#ssmlArea').val(): $('#textArea').val(),
          voice: voice,
          download: true
        };
        synthesizeRequest(utteranceDownloadOptions);
      }
    });

    $('.speak-button').click(function(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      $('.result').hide();

      $('#textArea').focus();
      if (validText(voice, textArea.val())) {
        var utteranceOptions = {
          text: currentTab === 'SSML' ? $('#ssmlArea').val(): $('#textArea').val(),
          voice: voice,
          sessionPermissions: JSON.parse(localStorage.getItem('sessionPermissions')) ? 0 : 1
        };

        synthesizeRequest(utteranceOptions, audio);
      }
      return false;
    });

    /**
     * Check that the text doesn't contains non latin-1 characters.
     * @param  String  The string to test
     * @return true if the string is latin-1
     */
    function containsAllLatin1(str) {
      return  /^[A-z\u00C0-\u00ff\s?@¿''\.,-\/#!$%\^&\*;:{}=\-_`~()0-9]+$/.test(str);
    }

    /**
    * Check that the text contains Japanese characters only
    * @return true if the string contains only Japanese characters
    */
    function containsAllJapanese(str) {
       return str.match(/^[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]+$/);
    }

    function validText(voice, text) {
      $('.error-row').css('visibility','hidden');
      $('.errorMsg').text('');
      $('.latin').hide();

      if ($.trim(text).length === 0) { // empty text
        showError('Please enter the text you would like to synthesize in the text window.');
        return false;
      }

      // check text validity based on language
      if (voice.substr(0,5) == 'ja-JP') {
         if (!containsAllJapanese(text)) {
            showError('Language not supported. Please use only Japanese characters');
            return false;
         }
      } else {
         if (!containsAllLatin1(text)) {
            showError('Language not supported. Please use only ISO 8859 characters');
            return false;
         }
      }
      return true;
    }
  }

  (function() {
    // Radio buttons for session permissions
    localStorage.setItem('sessionPermissions', true);
    var sessionPermissionsRadio = $('#sessionPermissionsRadioGroup input[type="radio"]');
    sessionPermissionsRadio.click(function() {
      var checkedValue = sessionPermissionsRadio.filter(':checked').val();
      localStorage.setItem('sessionPermissions', checkedValue);
    });
  }());

});
