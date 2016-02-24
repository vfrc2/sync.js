module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: { separator: ";"},
            generated: {
                files:{
                    src: "public/"
                }
            }

        }
    });


    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Default task(s).
    grunt.registerTask('default', ['uglify']);
    grunt.registerTask('build:frontend', [
        'useminPrepare',
        'concat',
        'uglify',
        'usemin']);

};