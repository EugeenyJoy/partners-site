const { src, dest, watch, parallel, series } = require('gulp'); 

const scss         = require('gulp-sass')(require('sass')); 
const concat       = require('gulp-concat');
const browserSync  = require('browser-sync').create();
const uglify       = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const imagemin     = require('gulp-imagemin');
const del          = require('del');

// функция автообновления в браузере
function browsersync() {
    browserSync.init({
        server : {
            baseDir : 'app/'
        }
    });
}

// очитска папки dist при билде
function cleanDist() {
    return del('public_html');  // папка, которую будем удалять
}

// функция сжатия картинок
function images() {
    return src('app/images/**/*')
        .pipe(imagemin(
            [
                imagemin.gifsicle({interlaced: true}),
                imagemin.mozjpeg({quality: 75, progressive: true}),
                imagemin.optipng({optimizationLevel: 5}),
                imagemin.svgo({
                    plugins: [
                        {removeViewBox: true},
                        {cleanupIDs: false}
                    ]
                })
            ]
        ))
        .pipe(dest('public_html/images'))
}

// функция преобразования скриптов
function scripts() {
    return src([
        'node_modules/jquery/dist/jquery.js',                   // подключение библиотеки jquery
        'app/assets/js/main.js'                                        // подключение кастомного js
    ])
    .pipe(concat('main.min.js'))                                // переименование выходного файла
    .pipe(uglify())                                             // сжатие файла
    .pipe(dest('app/assets/js'))                                       // папка выходного файла
    .pipe(browserSync.stream())                                 // обновление скриптов в браузере автоматически
}


// функция преобразования из препроцессора в css
function styles() {
    return src('app/assets/scss/style.scss')                           // путь исходного файла
        .pipe(scss({outputStyle: 'compressed'}))                // тип, например минификация
        .pipe(concat('style.min.css'))                          // изменение названия выходного файла с помощью плагина concat
        .pipe(autoprefixer({                                    // выставление преффиксов автоматически
            overrideBrowserslist: ['last 10 version'],
            grid: true
        }))
        .pipe(dest('app/assets/css'))                                  // куда складывать выходной файл
        .pipe(browserSync.stream())                             // обновление стилей в браузере автоматически
}

// функция билда
function build() {
    return src([       
        'app/assets/css/reset.css',                                 // массив путей откуда брать
        'app/assets/css/style.min.css',
        'app/assets/fonts/**/*',
        'app/assets/js/main.min.js',
        'app/*'
    ], {base: 'app'})                                             // указание базовой дирректории где всё лежит
    .pipe(dest('public_html'))                                    // куда складывать
}

// Фунция слежения за проектом (автоматического изменения файлов при сохранении)
function watching() {
    watch(['app/scss/**/*.scss'], styles);                       // [за чем следить], какую функцию выполнять
    watch(['app/js/**/*.js','!app/js/main.min.js'], scripts);
    watch(['app/*.html']).on('change', browserSync.reload);      // слежение за html файлами
}


exports.styles      = styles;                                    // gulp styles
exports.watching    = watching;                                  // gulp watching запуск слежения за проектом
exports.browsersync = browsersync;                               // gulp browsersync
exports.scripts     = scripts;                                   // gulp scripts
exports.images      = images;                                    // gulp images
exports.cleanDist   = cleanDist;                                 // gulp cleanDist

exports.build       = series(cleanDist, styles, scripts, images, build);           // gulp build
exports.default     = parallel(styles, scripts, browsersync, watching);   // gulp одновременный запуск тасков