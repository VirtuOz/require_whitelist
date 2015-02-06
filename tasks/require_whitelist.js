/*
 * grunt-require-whitelist
 * 
 *
 * Copyright (c) 2015 Matt Casella
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
  
  var detective = require('detective');
  var async = require('async');
  var fs = require('fs');

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('require_whitelist', 'Validate your NinaScript package to ensure required modules are on the Engineering whitelist', function () {

    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
        allow: [ 
        //allowed core modules
        'crypto', 'dns', 'http', 'https', 'path', 'url',
        
        //engineering white-listed modules
        //'soap', 'moment',
        'apnagent', 'futures', 'goo.gl', 'mustache', 'request','timezone-js', 'twilio', 'underscore', 'underscore.string',
        'ursa', 'validator', 'weather', 'xmldoc', 'xmldom', 'xpath', 'agentjs-commonlib', 'live-chat', 'vnodelib'
      ],
    
    
    });
    
    var errorRequires = [ ];
    
    var done = this.async();
    console.log('Checking files: ');
    console.log(this.filesSrc);
    
    function checkRequire(require){
        var requireString = require.requireString;  
        require.allowed = false;
        require.reason  = 'not on whitelist';  
            
        //console.log('require=['+require+']');
        if(!require || !requireString){ return require; }
        
        //we allow all local requires
        if(requireString.indexOf('.') === 0){
            //console.log('local OK');
            require.allowed = true;
            require.reason  = 'local';
        }
        else{
            var indexOf = grunt.util._.indexOf(options.allow, requireString);
            if(indexOf !== -1){
                require.allowed = true;
               require.reason = 'whitelisted';
            }
            //console.log('indexOf='+ indexOf +' allowed='+allowed);
        }
    
        return require;
    }
    
    function logRequire(require){
        if(require.allowed){
            grunt.log.writeln(require.file + ' requires ' + require.requireString['grey'] + ': line ' + require.line + ' ' + require.reason['green']);
        }
        else{
            grunt.log.writeln(require.file + ' requires ' + require.requireString['red'].bold + ': line ' + require.line + ' ' + require.reason['red']);
        }
        
    }

    async.forEach(this.filesSrc, function(filepath, next) {
        
        var opts = { nodes: true, parse: { range: true, loc: true } };
      
        var filename = '/Users/mcasella/workspace/NinaScript/USAA/workspace/whitelist/' + filepath;
        //console.log(filename);
        //console.log(grunt.file.read(filename));
       
        
        
        
        if(!grunt.file.isDir(filename)){
            var file = fs.readFileSync(filename);
            var requires = detective.find(file, opts);
            //console.dir(requires);
       
            if(requires){
                for(var i=0; i < requires.nodes.length; i++)
                {
                    var temp = { file: filepath, requireString: requires.strings[i], line: requires.nodes[i].loc.start.line};
                    //console.dir(temp);
                    
                    var require = checkRequire(temp);
                    //console.dir(require);
                    
                    logRequire(require);
                    
                    if(!require.allowed){
                        errorRequires.push(require); 
                    }
                }
            }
        }
        next();
        
    }, function(err) { 
        grunt.log.writeln("");
        if(errorRequires.length > 0)
        {   
            grunt.log.error("The following require statements are not allowed:");
            errorRequires.forEach(function(require){
                                    grunt.log.write("\t");
                                    logRequire(require);
                                });
            done(false);
        }
        else
        {
            grunt.log.ok("All require statements passed validation");
            done();
        }
    
    });
  });


};
