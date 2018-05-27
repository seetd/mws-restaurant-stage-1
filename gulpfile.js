const del = require('del');
const gulp = require('gulp');
const image_resize = require('gulp-image-resize');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const GOOGLE_API_KEY = require('./keys.config.json').GOOGLE_API_KEY;

const dirs = {
    src: 'src',
    dest: 'build'
}

const clean = () => del(['build']);  // del requires it to be a string and not a variable

const build_html = () => {
    return gulp.src([ `${dirs.src}/public/*.html` ])
        .pipe(replace('[GOOGLE_API_KEY]', GOOGLE_API_KEY))
        .pipe(gulp.dest(`${dirs.dest}/public/`));
}

const copy_static = () => {
    return gulp.src([
        `${dirs.src}/public/js/*`,
        `${dirs.src}/public/css/*`,
        `${dirs.src}/public/data/*`,
        `${dirs.src}/public/img/*`,
        `${dirs.src}/*.js`
    ],  {base: dirs.src}) 
    .pipe(gulp.dest(`${dirs.dest}`));
};

const build_all = gulp.series(clean, build_html, copy_static);
gulp.task('watch', () => {
    gulp.watch([dirs.src], build_all)
});
gulp.task('default', gulp.series(build_all, 'watch'), () => {
    console.log('Development started');
});