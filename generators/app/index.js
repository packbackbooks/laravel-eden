'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var path = require('path');

module.exports = yeoman.generators.Base.extend({
  prompting: function () {
    var done = this.async();

    var welcome =
    chalk.red('\n   ____') +
    chalk.red('\n   \\   \\            ') +    chalk.white('       _____________________') +
    chalk.red('\n    \\   \\      ____ ') +    chalk.white('      |                     |') +
    chalk.red('\n     \\   \\     \\   \\ ') + chalk.white('     |     LARAVEL EDEN    |') +
    chalk.red('\n      \\___\\_____\\___\\') + chalk.white('     |_____________________|') +
    chalk.red('\n            \\     \\') +
    chalk.red('\n             \\_____\\');
    console.log(welcome);

    var prompts = [

      {
        type: 'input',
        name: 'name',
        message: 'What is the name of your project?',
        default: 'laravel-eden-project'
      },
      {
        type: "list",
        name: "framework",
        message: "Is this a Laravel or Lumen project?",
        choices: [ "Laravel", "Lumen" ],
        filter: function( val ) { return val.toLowerCase(); }
      },
      {
        type: 'checkbox',
        name: 'packages',
        message: 'Would you like to install any Composer packages?',
        choices: [
          {
            value: 'league/fractal',
            name: 'Fractal',
            checked: false
          },
          {
            value: 'barryvdh/laravel-cors',
            name: 'Laravel CORS',
            checked: false
          },
          {
            value: 'iron-io/iron_mq',
            name: 'IronMQ',
            checked: false
          }
        ]
      },
      {
        type: 'confirm',
        name: 'infrastructure',
        message: 'Would you like to install the Packback infrastructure package?',
        default: true
      },
      {
        type: 'confirm',
        name: 'codeception',
        message: 'Would you like to use Codeception for testing?',
        default: true
      },
      {
        type: 'confirm',
        name: 'folders',
        message: 'Would you like to bootstrap the folder struture?',
        default: true
      }
    ];

    this.prompt(prompts, function (props) {
      this.props = props;
      // To access props later use this.props.someOption;

      done();
    }.bind(this));
  },

  configuring: {
    bower: function(){
      var done = this.async();
      this.log(chalk.cyan('Checking if bower is installed globally'));

      this.spawnCommand('bower', ['-v'])
      .on('error', function(){
        this.log(chalk.red('Bower does not appear to be installed. Please download it using npm install -g bower'));
        return false;
      }.bind(this))
      .on('exit', function(){
        this.log(chalk.green('Woo hoo! Bower found'));
      }.bind(this));
      done();
    },
    composer: function(){
      var done = this.async();
      this.log(chalk.cyan('Checking if composer is installed'));

      this.spawnCommand('composer', ['--version'])
      .on('error', function(){
        this.log(chalk.red('Composer does not appear to be installed Make sure it is available in your path or download it from getcomposer.org'));
        return false;
      }.bind(this))
      .on('exit', function(){
        this.log(chalk.green('Woo hoo! Composer found'));
      }.bind(this));
      done();
    },
  },

  writing: {
    service: function() {
      var done = this.async();
      this.spawnCommand('composer', ['create-project', 'laravel/' + this.props.framework, this.props.name, '--prefer-dist'])
        .on('error', function(){
          this.log(chalk.error('Error installing ' + this.props.framework));
          return false;
        }.bind(this))
        .on('exit', function(){
          this.log(chalk.green(this.props.framework + ' 5.1 installed'));
          done();
        }.bind(this));
    },

    app: function () {    
      this.destinationRoot(process.cwd() + '/' + this.props.name);
    },

    projectfiles: function () {
      this.fs.copy(
        this.templatePath('_bower.json'),
        this.destinationPath('bower.json')
      );
      this.fs.copy(
        this.templatePath('editorconfig'),
        this.destinationPath(process.cwd() + '/' + this.props.name + '/.editorconfig')
      );
      this.fs.copy(
        this.templatePath('jshintrc'),
        this.destinationPath(process.cwd() + '/' + this.props.name + '/.jshintrc')
      );
    },

    directories: function() {
      if ( this.props.folders ){
        this.spawnCommand('mkdir', ['app/Domains']);
        this.spawnCommand('mkdir', ['app/Services']);
        this.spawnCommand('mkdir', ['app/Repositories']);
        this.spawnCommand('mkdir', ['app/Transformers']);

        this.log(chalk.green('Directories bootstrapped!'));
      }
    }
  },

  install: function () {
    var i;
    var done = this.async();

    // Install Packages
    for (i = 0; i < this.props.packages.length; i++) {
      this.spawnCommand('composer', ['require', this.props.packages[i]])
        .on('error', function(){
          this.log(chalk.error('Error installing ' + this.props.packages[i]));
          return false;
        }.bind(this));
    }

    if ( this.props.codeception ){
      this.spawnCommand('composer', ['require', 'codeception/codeception', '--dev'])
        .on('error', function(){
          this.log(chalk.red('Could not install Codeception'));
          return false;
        }.bind(this))
        .on('exit', function(){
          this.spawnCommand('composer', ['require', 'codeception/mockery-module', '--dev']);
          this.spawnCommand('vendor/bin/codecept', ['bootstrap']);
        }.bind(this));

      this.log(chalk.green('Codeception installed!'));
    }
    
    this.installDependencies();
    done();
  }
});
