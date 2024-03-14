const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = express();
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const mysql = require("mysql2");
const cron = require('node-cron');
let cType = 'text/html';
let id = 36;
let clientIp;

// Подключение к бд
const config = {
    host: "127.0.0.1",
    user: "user",
    database: "database",
    password: "password"
};

// Create a MySQL pool
const pool = mysql.createPool(config);

const PORT = process.env.PORT || 3020

app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', (req, res) => {

    var descr = ' ';
    descr = req.body.description.replaceAll(/http:\/\/(\S+)/g, "<a target='_blank' href='\$&'>\$&</a>");
    let img_id = 0;
    req.body.description = descr;
    descr = req.body.description.replaceAll(/https:\/\/(\S+)/g, "<a target='_blank' href='\$&'>\$&</a>");
    req.body.description = descr;
    req.body.ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

    // sql = 'SELECT id FROM refItems ORDER BY id DESC;';
    // function query2(sql) {
    //     return new Promise((resolve, reject) => {
    //         pool.query(sql, (err, rows) => {
    //         if (err) 
    //           reject(err);
    //         else
    //           resolve(rows);
    //       });
    //     });
    //   }

    req.body.image = '';
    pool.query('SELECT MAX(iid) as id FROM reflastId ORDER BY id DESC LIMIT 1;', (error, result) => {
        if (error) throw error;
    
        if(req.files) {
        req.body.image = `user/${result[0].id + 1}.jpg`;
        } else {
            req.body.image = 'admin/photo_default.jpg';
        }

        if(req.files) {
            let file = req.files.image;
            file.mv(path.join(__dirname, `/public_html/images/user/${result[0].id + 1}.jpg`), function(err) {
                ++id;
                if (err)
                    return res.status(500).send(err);
            });
        }

        pool.query('INSERT INTO refItems SET ? ', req.body, (error, result) => {
            if (error) throw error;
            
            return;
        });

        pool.query('UPDATE reflastId SET iid = LAST_INSERT_ID(iid + 1) ', req.body, (error, result) => {
            if (error) throw error;
            
            return;
        });

          res.redirect('/');
    });


});

// app.post("/", (req, res) => {
//     if(!req.body) 
//         return res.sendStatus(400);
//     if(req.body.input_title.length > 50)
//         return res.sendStatus(400);
    
//     res.send(`${req.body.input_title} - ${req.body.input_tag}`);
// });

app.use(function(req, res, next) {
    req.getUrl = function() {
        return req.protocol + "://" + req.get('host') + req.originalUrl;
    }
    if (req.originalUrl.endsWith('.css')) {cType = 'text/css';}
    if (req.originalUrl.endsWith('.js')) {cType = 'application/javascript';}
    if (req.originalUrl.endsWith('gif')) {cType = 'image/gif';}
    if (req.originalUrl.endsWith('png')) {cType = 'image/png';}
    if (req.originalUrl.endsWith('jpg')) {cType = 'image/jpeg';}
    if (req.originalUrl.endsWith('jpeg')) {cType = 'image/jpeg';}
    if (req.originalUrl.endsWith('svg')) {cType = 'image/svg+xml';}
    let explodeUrl = req.originalUrl.split('/');
    let beforeUrl = [];
    for (let i = 1; i < (explodeUrl.length - 1); i++) {
        if (explodeUrl[i].length > 0) {
            beforeUrl.push(explodeUrl[i]);
        }

    }
    beforeUrl2 = beforeUrl.join('/');
    if (beforeUrl2.includes('assets')) {
        app.get(req.originalUrl,(req2,res2) => {
            res2.status(200);
            res2.setHeader('Content-Type', cType);
            res2.sendFile(path.join(__dirname + '/public_html/' + beforeUrl2, explodeUrl[explodeUrl.length - 1]));
        });
    }

    if (req.originalUrl.endsWith('.ico')) {
        app.get(req.originalUrl,(req2,res2) => {
            res2.status(200);
            res2.setHeader('Content-Type', 'image/x-icon');
            res2.sendFile(path.join(__dirname, 'public_html', explodeUrl[explodeUrl.length - 1]));
        });
    }
    app.get('/',(req2,res2) => {
        res2.status(200);
        const idAddress = req2.header('x-forwarded-for') || req2.connection.remoteAddress;
        // console.log(idAddress);

        res2.sendFile(path.join(__dirname, 'public_html', 'index.html'));
    });
    app.get('/about',(req2,res2) => {
        res2.status(200);
        res2.sendFile(path.join(__dirname, 'public_html', 'about.html'));

    });

    app.get('/rules',(req2,res2) => {
        res2.status(200);
        res2.sendFile(path.join(__dirname, 'public_html', 'rules.html'));

    });
    // app.get('/refItems_data', (req, res2) => {
    //     pool.query('SELECT * FROM refItems ORDER BY date_added ASC', (error, result) => {
    //         if (error) throw error;
        
    //         res2.send(result);
          
    //     });
    //   })

    app.get('/refItems_data', function(req, res) {
      const lastId = req.query.lastId;
      const tag = req.query.tag;
      const limit = req.query.limit;
      const idList = req.query.idList;
      
      let url = `SELECT * FROM refItems WHERE id NOT IN (${idList}) ORDER BY date_added DESC LIMIT ${limit}`;
      if (req.query.tag.length > 0) {
        url = `SELECT * FROM refItems WHERE tag = '${tag}' and id NOT IN (${idList}) ORDER BY date_added DESC LIMIT ${limit}`;
      }

      pool.query(url, function(error, results) {
        if (error) throw error;
        res.send(results);
      });
    });

    app.get('/topItems_data', function(req, res2) {
        pool.query('SELECT * FROM topItems;', (error, result) => {
        if (error) throw error;
    
        res2.send(result);
      
        });
    });

    function updateTopItems() {
        pool.query('SELECT * FROM topItems;', (error, result) => {
        if (error) throw error;
    
        // console.log(result);
      
        });
    }

    updateTopItems();

   app.get('/getLastId', (req, res2) => {
    pool.query('SELECT MAX(iid) as id FROM reflastId ORDER BY id DESC LIMIT 1;', (error, result) => {
        if (error) throw error;
    
        res2.send(result);
      
    });
  })

   app.get('/getTags', (req, res2) => {
    pool.query('SELECT DISTINCT tag FROM refItems ORDER BY tag ASC;', (error, result) => {
        if (error) throw error;
    
        res2.send(result);
      
    });
  })

   app.get('/ipList', (req, res2) => {
    clientIp = req.header('x-forwarded-for') || req.connection.remoteAddress;

    pool.query(`SELECT id FROM refItems where ip = '${clientIp}';`, (error, result) => {
        if (error) throw error;
    
        res2.send(result);
      
    });
  })

    // Функция очистки от старых записей
    app.get('/refItems_delOld', (req, res2) => {

        // Удаляет картинки записей старше 2 дней
        pool.query("SELECT id FROM refItems WHERE isAdmin = 0 and NOW() > DATE_ADD(date_added, INTERVAL 2 DAY);", (error, res3) => {
            if (error) throw error;
            // console.log(res3);
            for (let item of res3) {
                
                fs.access(`public_html/images/user/${item.id}.jpg`, function(error){
                    if (error) {
                        // console.log("Файл не найден");
                    } else {
                        // console.log("Файл найден");
                        fs.unlinkSync(`public_html/images/user/${item.id}.jpg`);
                    }
                });
                
            }
            res2.send(res3);


            // Очищает поле ip у записей старше 1 дня
            pool.query("UPDATE refItems SET IP = '' WHERE NOW() > DATE_ADD(DATE_ADDED, INTERVAL 1 DAY);", (error, result) => {
                if (error) throw error;
            
                // console.log(result);
                
            });
        }); 
    })


    let requestLoop = setInterval(function(){
        http.get(`http://test.eugeenyjoy.ru/refItems_delOld`);
      }, 60000);

    return next();
});



// Listen both http & https ports
const httpServer = http.createServer(app);
// const httpsServer = https.createServer({
//   key: fs.readFileSync('/home/admin/conf/web/eugeenyjoy.ru/ssl/test.eugeenyjoy.ru.key'),
//   cert: fs.readFileSync('/home/admin/conf/web/eugeenyjoy.ru/ssl/test.eugeenyjoy.ru.pem'),
// }, app);

httpServer.listen(3020, () => {
    console.log('HTTP Server running on port 3020');
});

// httpsServer.listen(3021, () => {
//     console.log('HTTPS Server running on port 3021');
// });

// Запуск крон
cron.schedule('0 * * * *', () => {
    console.log('cron work');
  // Выполнение очистки MySQL таблицы
  pool.query('DELETE FROM refItems WHERE isAdmin = 0 and NOW() > DATE_ADD(date_added, INTERVAL 2 DAY)', (error, results) => {
    if (error) {
      console.error('Ошибка очистки таблицы:', error);
    } else {
      console.log('Таблица очищена успешно.');
    }
  });
});

const topItemsQuery = `
  SELECT * FROM refItems
  WHERE date_added >= DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY)
  ORDER BY RAND()
  LIMIT 3
`;

const topItemsQuery2 = `
  SELECT * FROM refItems
  WHERE date_added < DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY)
  ORDER BY RAND()
  LIMIT ?
`;

cron.schedule('50 23 * * *', () => {
  // Выполнение очистки MySQL таблицы
  pool.query('DELETE FROM topItems', (error, results) => {
    if (error) {
      console.error('Ошибка очистки таблицы:', error);
    } else {
      console.log('Таблица очищена успешно.');
    }
  });

      pool.query(topItemsQuery, (error, results) => {
        if (error) {
          console.error('Ошибка выполнения запроса:', error);
          return;
        } 

        const countRemaining = 3 - results.length;
        console.log("countRemaining",countRemaining);

        pool.query(topItemsQuery2, [countRemaining], (err, additionalResults) => {
            if (err) {
              console.error('Ошибка выполнения запроса:', err);
              return;
            } 
            
            let allResults = results.concat(additionalResults);
            allResults = allResults.sort(() => Math.random() - 0.5);

            // Выполнение оператора INSERT с результатами
            const insertQuery = 'INSERT INTO topItems (id, title, description, author, image) VALUES ?';
            const values = allResults.map(row => [row.id, row.title, row.description, row.author, row.image]);
            
            pool.query(insertQuery, [values], (err, result) => {
              if (err) {
                console.error('Ошибка выполнения INSERT:', err);
                return;
              } 
              console.log('INSERT выполнен успешно ', result);
            });
        });

    });
});
