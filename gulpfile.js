/* eslint-disable */
const gulp = require("gulp");
const { task, src, watch, series } = require("gulp");
const webpack = require("webpack-stream");
const sourcemaps = require("gulp-sourcemaps");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");

const postcss = require("gulp-postcss");
const precss = require("precss");
const autoprefixer = require("autoprefixer");
const cleanCSS = require("gulp-clean-css");
const pxtorem = require("postcss-pxtorem");
const tailwindcss = require("tailwindcss");

const njRender = require("gulp-nunjucks-render");
const htmlmin = require("gulp-htmlmin");

const nj = njRender.nunjucks;

const browserSync = require("browser-sync");
const server = browserSync.create();

task("scripts", () =>
  src("src/scripts/app.js")
    .pipe(webpack({ mode: "development" }))
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ["env"],
      })
    )
    .pipe(rename("app.js"))
    .pipe(gulp.dest("dist"))
    .pipe(rename("app.min.js"))
    .pipe(uglify())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist"))
);

task("styles", () => {
  const processors = [precss(), tailwindcss(), autoprefixer(), pxtorem()];
  return src("src/styles/styles.css")
    .pipe(sourcemaps.init())
    .pipe(postcss(processors))
    .on("error", function (error) {
      console.log(error.toString());
      this.emit("end");
    })
    .pipe(cleanCSS())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist"));
});

task("markup", () => {
  nj.configure(["src/templates"], { watch: false });
  return src("src/html/**/*.+(html|nj|nunjucks)")
    .pipe(
      njRender({
        path: ["src/templates/"],
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("dist"));
});

task("images", () =>
  src("src/images/**/*.+(gif|jpg|png|svg|ico)").pipe(gulp.dest("dist/images"))
);

task("watch", () => {
  watch(
    [
      "src/templates/**/*.+(html|nj|nunjucks)",
      "src/html/**/*.+(html|nj|nunjucks)",
    ],
    series(task("markup"), reload)
  );
  watch("src/styles/**/*.css", series(task("styles"), reload));
  watch("src/scripts/**/*.js", series(task("scripts"), reload));
  watch("src/images/**/*.+(gif|jpg|png|svg)", series(task("images"), reload));
});

function reload(done) {
  server.reload();
  done();
}

function sync(done) {
  server.init({
    open: false,
    server: {
      baseDir: "./dist",
    },
  });
  done();
}

exports.server = series([
  task("markup"),
  task("styles"),
  task("images"),
  task("scripts"),
  sync,
  task("watch"),
]);

exports.default = series([
  task("markup"),
  task("styles"),
  task("images"),
  task("scripts"),
]);
