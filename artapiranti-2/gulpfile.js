'use strict'

const gulp = require('gulp')
const runSequence = require('run-sequence')
const lazypipe = require('lazypipe')
const clean = require('gulp-clean')
const gulpif = require('gulp-if')
const replace = require('gulp-replace')

const uglify = require('gulp-uglify')
const jshint = require('gulp-jshint')
const concat = require('gulp-concat')

const postcss = require('gulp-postcss')
const cssnano = require('cssnano')
const autoprefixer = require('autoprefixer')

const htmlreplace = require('gulp-html-replace')
const htmlmin = require('gulp-htmlmin')

const rev = require('gulp-rev')
const revReplace = require('gulp-rev-replace')

// const uploadFile = require('./s3helper')

const paths = {
  root: '.',
  src: {
    root: 'src',
    all: 'src/**/*.*',
    revs: 'src/static/**/*.*',
    html: 'src/*.html',
    js: 'src/static/js/*.*',
    css: [
      'src/static/css/reset.css',
      'src/static/css/page.css',
      'src/static/css/*.*'
    ],
    img: 'src/static/img/*.*',
    font: 'src/static/fonts/*.*',
    lang: 'src/static/lang/*.*'
  },
  dist: {
    root: 'dist',
    all: 'dist/**/*.*',
    js: 'dist/static/js',
    css: 'dist/static/css',
    img: 'dist/static/img',
    font: 'dist/static/fonts'
  }
}

// const rev4html = 'rev-4-html.json'
// const rev4jscss = 'rev-4-jscss.json'
// const r4jcmf = gulp.src(rev4jscss)
const revFile = 'rev-manifest.json'
const manifest = gulp.src(revFile)
const revCss = 'rev-css.json'
const minCss = 'main.min.css'
const revJs = 'rev-js.json'
const minJs = 'main.min.js'

const cdnPrefix = '//s.yogrt.co/api/'

gulp.task('clean', () => {
  return gulp.src(paths.dist.root, { read: false })
    .pipe(clean({
      force: true
    }))
})

const jsCond = (f) => {
  if (f.path.endsWith('.min.js')) {
    return false
  } else {
    return true
  }
}

const optimizeJs = lazypipe()
  .pipe(jshint)
  .pipe(jshint.reporter)
  .pipe(jshint.reporter, 'fail')
  .pipe(uglify)
  .pipe(concat, minJs)
  .pipe(rev)
  .pipe(gulp.dest, paths.dist.js)
  .pipe(rev.manifest, revJs)
  .pipe(gulp.dest, paths.root)

const transferLibJs = lazypipe()
  .pipe(rev)
  .pipe(gulp.dest, paths.dist.js)

gulp.task('build-js', () => {
  return gulp.src(paths.src.js)
    .pipe(gulpif(jsCond, optimizeJs(), transferLibJs()))
})

const cssCond = (f) => {
  if (f.path.endsWith('.min.css')) {
    return false
  } else {
    return true
  }
}

const processors = [
  autoprefixer({ browsers: ['> 0.01%'] }),
  cssnano()
]

const optimizeCss = lazypipe()
  .pipe(revReplace, { manifest: manifest })
  .pipe(concat, minCss)
  .pipe(postcss, processors)
  .pipe(rev)
  .pipe(gulp.dest, paths.dist.css)
  .pipe(rev.manifest, revCss)
  .pipe(gulp.dest, paths.root)

const transferLibCss = lazypipe()
  .pipe(rev)
  .pipe(gulp.dest, paths.dist.css)

gulp.task('build-css', () => {
  return gulp.src(paths.src.css)
    .pipe(gulpif(cssCond, optimizeCss(), transferLibCss()))
})

// gulp.task('revs', ['rev-4-html', 'rev-4-jscss'])
gulp.task('revs', () => {
  return gulp.src(paths.src.revs)
    .pipe(rev())
    .pipe(rev.manifest(revFile))
    .pipe(gulp.dest(paths.root))
})

/*
gulp.task('rev-4-jscss', () => {
  return gulp.src(paths.src.revs)
    .pipe(rev())
    .pipe(rev.manifest(rev4jscss))
    .pipe(gulp.dest(paths.root))
})

gulp.task('rev-4-html', () => {
  return gulp.src(paths.src.all)
    .pipe(rev())
    .pipe(rev.manifest(rev4html))
    .pipe(gulp.dest(paths.root))
})
*/

gulp.task('transfer-resource', () => {
  return gulp.src([paths.src.font, paths.src.img, paths.src.lang], { base: paths.src.root })
    .pipe(rev())
    .pipe(gulp.dest(paths.dist.root))
})

gulp.task('build-html', () => {
  let minopt = {
    removeComments: true,
    collapseWhitespace: true,
    minifyJS: true,
    minifyCSS: true
  }
  return gulp.src(paths.src.html)
    .pipe(htmlreplace({
      js: 'static/js/main.min.js',
      css: 'static/css/main.min.css'
    }))
    .pipe(revReplace({ manifest: gulp.src(revCss) }))
    .pipe(revReplace({ manifest: gulp.src(revJs) }))
    .pipe(revReplace({ manifest: gulp.src(revFile) }))
    .pipe(htmlmin(minopt))
    .pipe(gulp.dest(paths.dist.root))
})

gulp.task('del', () => {
  return gulp.src('./rev-*.json', { read: false })
    .pipe(clean({
      force: true
    }))
})

gulp.task('cdn', ['cdn-html', 'cdn-jscss'])

gulp.task('s3-upload', () => {
  uploadFile()
})

gulp.task('cdn-html', () => {
  return gulp.src('dist/index.html')
    // .pipe(replace(/(static\/(img|css|js)\/.*)/g, cdnPrefix + '$1'))
    .pipe(replace('static/', cdnPrefix + 'static/'))
    .pipe(gulp.dest('.'))
})

gulp.task('cdn-jscss', () => {
  return gulp.src('dist/static/**/main-*.min.*')
    .pipe(replace('../', cdnPrefix + 'static/'))
    .pipe(gulp.dest('.'))
})

gulp.task('build', () => {
  require('fs').exists(revFile, (exists) => {
    if (!exists) {
      console.log('Warning:\n    use command `gulp revs` to generate rev-manifest.json config file first, then use command `gulp build` to build')
    } else {
      runSequence('clean', ['build-js', 'build-css', 'transfer-resource'], ['build-html', 'del'])
    }
  })
})

gulp.task('default', () => {
  console.log('Note:\n    1. use command `gulp revs` to generate rev-manifest.json config file\n    2. then use command `gulp build` to build\n    3. compress images manually')
})
