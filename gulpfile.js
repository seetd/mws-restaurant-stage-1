const del = require('del');
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const clean_css = require('gulp-clean-css');
const concat = require('gulp-concat');

const dirs = {
    src: 'src',
    dest: 'build'
}

const clean = () => del(['build']);  // del requires it to be a string and not a variable

const build_html = () => {
    return gulp.src([ `${dirs.src}/public/*.html` ])
        .pipe(gulp.dest(`${dirs.dest}/public/`));
}

const build_css_source = (source) => {
    return gulp.src([
            `${dirs.src}/public/css/styles.css`,
            `${dirs.src}/public/css/${source}.css`,
            `${dirs.src}/public/css/toast.css`
        ])
        .pipe(clean_css({ sourceMap: true }))
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
        .pipe(concat(`${source}.min.css`))
        .pipe(gulp.dest(`${dirs.dest}/public/css`));
}

const build_css_index = () => build_css_source('index');
const build_css_restaurant = () => build_css_source('restaurant');

const build_css = gulp.series(build_css_index, build_css_restaurant);

const copy_static = () => {
    return gulp.src([
        `${dirs.src}/public/**/*.json`,
        `${dirs.src}/public/img/*`,
        `${dirs.src}/**/*.js`
    ],  {base: dirs.src}) 
    .pipe(gulp.dest(`${dirs.dest}`));
};

const build_all = gulp.series(clean, build_html, build_css, copy_static);
gulp.task('watch', () => {
    gulp.watch([dirs.src], build_all)
});
gulp.task('default', gulp.series(build_all, 'watch'), () => {
    console.log('Development started');
});