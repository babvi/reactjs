var gulp = require("gulp");
var concat = require("gulp-concat");

function styles() {
  return gulp
    .src(["./build/static/css/**/*.css"])
    .pipe(concat({ path: "app-chat.css" }))
    .pipe(gulp.dest("dist/"));
}

function scripts() {
  return gulp
    .src(["./build/static/js/**/*.js"])
    .pipe(concat({ path: "app-chat.js" }))
    .pipe(gulp.dest("dist/"));
}

function testfile() {
  return gulp
    .src(["./src/assets/**/*.html"])
    .pipe(concat({ path: "index.html" }))
    .pipe(gulp.dest("dist/"));
}

function media() {
  return gulp.src(["./src/assets/images/**/*"]).pipe(gulp.dest("dist/media"));
}

gulp.task("default", gulp.series(scripts, styles, testfile, media));
