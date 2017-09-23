
import autoprefixer from 'gulp-autoprefixer'
import babel from 'rollup-plugin-babel'
import buffer from 'vinyl-buffer'
import cleanCSS from 'gulp-clean-css'
import commonJs from 'rollup-plugin-commonjs'
import gulp from 'gulp'
import nodeResolve from 'rollup-plugin-node-resolve'
import rename from 'gulp-rename'
import rollup from 'rollup-stream'
import sass from 'gulp-sass'
import sassSVGInliner from 'sass-inline-svg'
import source from 'vinyl-source-stream'
import sourcemaps from 'gulp-sourcemaps'
import standard from 'gulp-standard'
import uglify from 'gulp-uglify'

let meta = require('./package.json')

let paths = {
  script: './script',
  scriptDist: './public/dist/script',
  style: './style',
  styleDist: './public/dist/style',
}

gulp.task('lint-script', () => {
  return gulp.src(paths.script + '/**/*.js')
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true,
      quiet: true
    }))
})

let rollupCache

gulp.task('script', ['lint-script'], () => {
  // run module builder and return a stream
  const stream = rollup({
    input: paths.script + '/index.js',
    external: [
    ],
    plugins: [
      babel({
        babelrc: false,
        presets: [
          ['es2015', {
            loose: true,
            modules: false
          }]
        ],
        plugins: ['external-helpers'],
        exclude: ['node_modules/**']
      }),
      nodeResolve({
        jsnext: true,
        main: true
      }),
      commonJs({
        include: ['node_modules/**']
      })
    ],
    format: 'umd',
    sourcemap: true,
    cache: rollupCache,
    amd: { id: meta.name }
  })

  return stream
    // enable rollup cache
    .on('bundle', (bundle) => {
      rollupCache = bundle
    })

    // handle errors gracefully
    .on('error', err => {
      console.error(err.message)
      if (err.codeFrame !== undefined) {
        console.error(err.codeFrame)
      }
      stream.emit('end')
    })

    // set output filename
    .pipe(source(meta.name + '.js', paths.src))

    // buffer the output, most gulp plugins do not support streams
    .pipe(buffer())

    // init sourcemaps with inline sourcemap produced by rollup-stream
    .pipe(sourcemaps.init({
      loadMaps: true
    }))

    // minify code
    .pipe(uglify())

    // save result
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.scriptDist))
})

gulp.task('style', () => {
  return gulp.src(paths.style + '/main.scss')

    // init sourcemaps
    .pipe(sourcemaps.init())

    // compile sass to css
    .pipe(
      sass({
        includePaths: ['node_modules'],
        outputStyle: 'expanded',
        functions: {
          'inline-svg': sassSVGInliner('assets/svg')
        }
      })
        .on('error', sass.logError)
    )

    // autoprefix css
    .pipe(autoprefixer('last 2 version', 'ie 11', '> 1%'))

    // minify
    .pipe(cleanCSS({ processImport: false }))

    // save result
    .pipe(rename(meta.name + '.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.styleDist))
})

gulp.task('watch', () => {
  // watch scripts
  gulp.watch(
    [paths.script + '/**/*.js'],
    ['script'])
  // watch styles
  gulp.watch(
    [paths.style + '/**/*.scss'],
    ['style'])
})

gulp.task('build', ['script', 'style'])
gulp.task('default', ['script', 'style', 'watch'])
