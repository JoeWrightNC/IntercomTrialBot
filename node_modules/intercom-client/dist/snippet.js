'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _index = require('./index');

var _htmlencode = require('htmlencode');

var _htmlencode2 = _interopRequireDefault(_htmlencode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Snippet = function () {
  function Snippet(settings) {
    _classCallCheck(this, Snippet);

    this.loggedOut = !settings.user_id && !settings.email;

    if (!settings.app_id) {
      throw new Error('You must provide an app_id in your Intercom settings');
    }
    if (!this.loggedOut && !settings.verificationSecret) {
      throw new Error('You must provide your verification secret in your Intercom settings');
    }

    this.settings = settings;
  }

  _createClass(Snippet, [{
    key: 'create',
    value: function create() {
      var verificationSecret = this.getVerificationSecret();
      var identifier = this.getIdentifier();
      this.setUserHash(verificationSecret, identifier);
      return this.generateSnippetHTML();
    }
  }, {
    key: 'getVerificationSecret',
    value: function getVerificationSecret() {
      var verificationSecret = this.settings.verificationSecret;

      delete this.settings.verificationSecret;
      return verificationSecret;
    }
  }, {
    key: 'getIdentifier',
    value: function getIdentifier() {
      if (this.settings.user_id) {
        return this.settings.user_id.toString();
      } else {
        return this.settings.email;
      }
    }
  }, {
    key: 'setUserHash',
    value: function setUserHash(verificationSecret, identifier) {
      if (this.loggedOut) {
        return;
      }

      var userHash = _index.IdentityVerification.userHash({
        secretKey: verificationSecret,
        identifier: identifier
      });
      this.settings.user_hash = userHash;
    }
  }, {
    key: 'generateSnippetHTML',
    value: function generateSnippetHTML() {
      return '\n<script>\n  window.intercomSettings = {\n    ' + this.settingsToString(this.settings) + '\n  };\n</script>\n<script>(function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic(\'reattach_activator\');ic(\'update\',intercomSettings);}else{var d=document;var i=function(){i.c(arguments)};i.q=[];i.c=function(args){i.q.push(args)};w.Intercom=i;function l(){var s=d.createElement(\'script\');s.type=\'text/javascript\';s.async=true;s.src=\'https://widget.intercom.io/widget/' + this.settings.app_id + '\';var x=d.getElementsByTagName(\'script\')[0];x.parentNode.insertBefore(s,x);}if(w.attachEvent){w.attachEvent(\'onload\',l);}else{w.addEventListener(\'load\',l,false);}}})()</script>\n    ';
    }
  }, {
    key: 'settingsToString',
    value: function settingsToString(settings) {
      var _this = this;

      var intercomSettings = [];
      Object.keys(settings).map(function (key) {
        if (_typeof(settings[key]) === 'object' && settings[key] !== null) {
          intercomSettings.push(key + ': { ' + _this.settingsToString(settings[key]) + ' }');
        } else {
          var escapedKey = _this.escapeString(key);
          var value = _this.escapeString(settings[key]);
          if (typeof settings[key] === 'string') {
            intercomSettings.push(escapedKey + ': "' + value + '"');
          } else {
            intercomSettings.push(escapedKey + ': ' + value);
          }
        }
      });
      return intercomSettings.join(', ');
    }
  }, {
    key: 'escapeString',
    value: function escapeString(string) {
      if (typeof string === 'string') {
        string = _htmlencode2.default.htmlEncode(string).replace(/\&quot;/gi, '\\"');
      }
      return string;
    }
  }]);

  return Snippet;
}();

exports.default = Snippet;