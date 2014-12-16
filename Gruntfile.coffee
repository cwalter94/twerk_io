module.exports = ->

  @loadNpmTasks 'grunt-contrib-watch'
  @loadNpmTasks 'grunt-contrib-coffee'
  @loadNpmTasks 'grunt-contrib-sass'

  @initConfig
    sass:
      dist:
        files:
          'public/css/account.css': 'scss/account.scss'
          'public/css/all.css': 'scss/all.scss'
    watch:
      sass:
        files: ['scss/account.scss', 'scss/all.scss']
        tasks: ['sass']

  @registerTask 'default', ['sass', 'watch']
