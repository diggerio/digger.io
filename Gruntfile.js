module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  process.env.DEBUG = '';
  process.env.CONSOLE = 'false';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: {
      files: ['test/**/*.test.js']
    },
    mochaTestConfig: {
      options: {
        reporter: 'spec',
        timeout: 500,
        require: 'test/common'
      }
    },
    jshint: {
      // define the files to lint
      files: ['gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      // configure JSHint (documented at http://www.jshint.com/docs/)
      options: {
        asi:true,
        boss:true,
        proto:true,
          // more options here if you want to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true
        }
      }
    }
  });

  // this would be run by typing "grunt test" on the command line
  grunt.registerTask('test', ['jshint', 'mochaTest']);

  // the default task can be run just by typing "grunt" on the command line
  grunt.registerTask('default', ['jshint', 'mochaTest']);

};