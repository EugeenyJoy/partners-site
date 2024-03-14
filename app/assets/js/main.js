document.addEventListener("DOMContentLoaded", function(event) {
         
  const INPUTS_LIMITS = [50, 250, 20, 20];
  const INPUTS_MINS = [1, 1, 0, 1];
  let scrolInd = 0;
  let blockIp = 0;

  MAX_FILE_SIZE = 2097152; // размер  файла до 2 мб

  const inputExpandForm = document.querySelector('.input__expand-form');
  const ExpandForm = document.querySelector('.input__form-wrapper');

  fetch('/ipList')
  .then(response => response.text())
  .then(text => {
    blockId = JSON.parse(decodeURIComponent(text));
    
    if (blockId.length > 0) {
      inputExpandForm.style.backgroundColor = 'lightgrey';
      inputExpandForm.innerHTML = 'Card added';
      blockIp = 1;
    } else {
        inputExpandForm.addEventListener('click', (e) => {
        if (e.target.innerHTML == 'Add a card') {
          e.target.innerHTML = 'Minimize';
          ExpandForm.style.height = '100%';
          ExpandForm.style.padding = '20px';
        } else {
          e.target.innerHTML = 'Add a card';
          ExpandForm.style.height = 0;
          ExpandForm.style.padding = 0;
        }
      });
    }
    
  });
    

  let main__items;

  if (document.querySelector('.main__items')) {
    const MAIN_ITEMS_WRAPPER = document.querySelector('.main__items');
    const TOP_ITEMS_WRAPPER = document.querySelector('.main__top .main__top-inner');

    let tag_field = '';
    let date_field = '';

      // Получаем ссылку на контейнер, в котором будут отображаться элементы
      const container = document.querySelector('.main__items');
      let curTag = '';
      let tags = [];
      let lastIdDecoded;
      let idList = [];

      const MAIN_NAV_ITEMS_WRAPPER = document.querySelector('.main__nav-items');
    
      fetch('/getTags')
      .then(response => response.text())
      .then(text => {
        const tags = JSON.parse(decodeURIComponent(text));
        for (tag of tags) {
          if(tag.tag != ' ' && tag.tag != '') {
            MAIN_NAV_ITEMS_WRAPPER.insertAdjacentHTML('beforeend', `<div class="main__nav-item" data-tag="` + tag.tag + `">` + tag.tag + `</div>`);
          }
        }

        const MAIN_NAV_ITEM = MAIN_NAV_ITEMS_WRAPPER.querySelectorAll('.main__nav-item');
      
        for(item of MAIN_NAV_ITEM) {
          item.addEventListener('click', (e) => {
            for(item of MAIN_NAV_ITEM) {
              item.style.backgroundColor = 'unset';
              item.style.color = '#000';
            }
            e.target.style.backgroundColor = '#07f';
            e.target.style.color = '#fff';
            container.innerHTML = '';
            curTag = e.target.dataset.tag;
            idList.splice(0,idList.length);
            idList[0] = 0;
            fetchData(curTag);
          });
        }

      });
    
    
      idList[0] = 0;
      // Первая загрузка данных
      fetchData('');


      // Функция для получения данных
      async function fetchData(tag) {
          // Запрос для получения значения lastId
        const response = await fetch('/getLastId');
        const lastIdEncoded = await response.text();
        lastIdDecoded = JSON.parse(decodeURIComponent(lastIdEncoded));
        
        const limit = 6;

        // Использование полученного значения lastId в запросе /refItems_data
        const url = `/refItems_data?tag=${tag}&idList=${idList}&limit=${limit}`;
        const response2 = await fetch(url);
        const data = await response2.json();

        const items = data;
        items.forEach(item => {
          
          lastIdDecoded = item.id;
          idList.push(item.id);
          let datestring = jsDate(item.date_added, 2);

          if(item.author.length < 1) {
            item.author = 'Anonym';
          }

          let item_image = 'images/admin/photo_default.jpg';

          if(item.image == null || item.image == '') {
            item_image = 'images/admin/photo_default.jpg'
          } else {
            item_image = 'images/' + item.image;
          }

          if (item.tag.length < 1) {
            item.tag = ' '
            }
            
            if(item.tag == ' ') {
              // datestring = jsDate(item.date_added, 100);
            }
            if(item.isAdmin == 1) {
              tag_field = '';
              date_field = '';
            } else {
              tag_field = `<p>Тег: <span class="item-tag">` + item.tag + `</span></p>`;
              date_field = `<div class="date-added"> <span>Until</span> <span>` + datestring + `</span> </div>`;
            }
          

          const element = document.createElement('div');

          element.className = 'main__items-col';
          element.innerHTML = `
          <div class="main__item">
            <div class="item-image" >
                <img src="` + item_image + `" alt="item-image">
            </div>
            <div class="item-text">
                <p class="item-title">` + item.title + `</p>
                <p class="item-description">` + item.description + `</p>
                <p>Author: <span class="item-author">` + item.author + `</span></p>
                `+ tag_field +`
            </div>
            <div class="item-info">
                `+ date_field + `
               
            </div>
          </div> 
          `;

          element.setAttribute('data-id', item.id);
          container.appendChild(element);

        });

      }

      // Функция для проверки, нужно ли загружать новые элементы
      function checkScroll() {
        // Получаем координаты нижней границы контейнера и координаты нижней границы окна браузера
        const containerBottom = container.getBoundingClientRect().bottom;
        const windowBottom = window.innerHeight;

        // Если нижняя граница контейнера достигнута или пройдена, загружаем новые элементы
        if (containerBottom <= windowBottom) {
          scrolInd = 1;
          fetchData(curTag);
        }
      }

      // Добавляем обработчик события прокрутки страницы
      window.addEventListener('scroll', checkScroll);

  }

  let top_items;

  if (document.querySelector('.main__top')) {
    const TOP_ITEMS_WRAPPER = document.querySelector('.main__top .main__top-inner');

      fetchTopData();

      // Функция для получения данных
      async function fetchTopData() {
          // Запрос для получения значения lastId
        const response = await fetch('/topItems_data');
        const lastIdEncoded = await response.text();
        
        const limit = 3;

        // Использование полученного значения lastId в запросе /refItems_data
        const url = '/topItems_data';
        
        const response2 = await fetch(url);
        const data = await response2.json();

        let items = data;
        // let items = [
        //   {title: 'название', description: 'описание', author: 'автор',image: null },
        //   {title: 'название2', description: 'описание2', author: 'автор2',image: null },
        //   {title: 'название3', description: 'описание3', author: 'автор3',image: null }
        //   ]

        items.forEach(item => {
          console.log('top-item: ', item);
          if(item.author.length < 1) {
            item.author = 'Anonym';
          }

          let item_image = 'images/admin/photo_default.jpg';

          if(item.image == null) {
            item_image = 'images/admin/photo_default.jpg'
          } else {
            item_image = 'images/' + item.image;
          }

          const element = document.createElement('div');

          element.className = 'main__top-col';
          element.innerHTML = `
          <div class="main__top-item">
            <div class="item-image" >
                <img src="` + item_image + `" alt="item-image">
            </div>
            <div class="item-text">
                <p class="item-title">` + item.title + `</p>
                <p class="item-description">` + item.description + `</p>
                <p>Author: <span class="item-author">` + item.author + `</span></p>
            </div>
          </div> 
          `;
            
          element.setAttribute('data-id', item.id);
          TOP_ITEMS_WRAPPER.appendChild(element);

        });

      }
  }
  
  // function unique(arr) {
  //   let result = [];
  
  //   for (let str of arr) {
  //     if (!result.includes(str)) {
  //       result.push(str);
  //     }
  //   }
  
  //   return result;
  // }

  function jsDate(date_added, added_days) {
    let javaDate = new Date(date_added);
    javaDate.setDate(javaDate.getDate() + added_days);
    let datestring = javaDate.getDate()  + "." + (javaDate.getMonth()+1) + "." + javaDate.getFullYear() + " " + javaDate.getHours() + ":" + javaDate.getMinutes();
    return datestring;
  }

  let form = document.querySelector('#addRefItemForm');
  let btn = document.querySelector('#addRefItemFormBtn');
  document.querySelector("#Crange").addEventListener("change", function() {
    if(this.value > 3.07 && this.value < 4.34) {
        btn.addEventListener('click', addRefItem);
        btn.classList.add("activeBtn");
    } else {
      btn.removeEventListener('click', addRefItem);
      btn.classList.remove("activeBtn");
    }
  });


      //Check filesize
  document.querySelector("#input_img").addEventListener("change", function() {
  let file = this.files[0];
  
  console.log("File size: " + file.size + " bytes");

  if (file.size > MAX_FILE_SIZE) {
    console.log("File is too large. Maximum allowed file size is " + MAX_FILE_SIZE + " bytes.");

    // let input = document.querySelector("#input_img");
    // let newInput = input.cloneNode(false);
    // input.parentNode.replaceChild(newInput, input);
    form.elements['image'].value = '';
    let image_alert = document.querySelector('.alert-input_image');
    image_alert.style.visibility = "visible"
    setTimeout(() => image_alert.style.visibility = "hidden" , 3000);

    return;
  }
});
  
  function addRefItem() {
    
    let inputs = form.querySelectorAll('.addRefIteminput');
    let inputs_alerts = form.querySelectorAll('.alert');

    if(blockIp != 1) {
      for(let i = 0; i < inputs.length; ++i) {
        if(inputs[i].value.length > INPUTS_LIMITS[i] || inputs[i].value.trim().length < INPUTS_MINS[i]) {
          inputs_alerts[i].style.visibility = "visible"
          setTimeout(() => inputs_alerts[i].style.visibility = "hidden" , 3000);

          return;
        }
    }

    console.log("success");
    form.submit();

    }

  }
    
});

const output = document.querySelector('output')

const captcha = (event) => {
  const { value, min, max, step, parentElement: parent } = event.target
  const decimals = step && step.includes('.') ? step.split('.')[1] : 1
  const percent = `${((value - min)/(max - min) * 100).toFixed(decimals)}%`
  parent.style.setProperty('--p', percent)

  output.style.opacity = "unset";
  if(value > 3.07 && value < 4.34) {
    output.value = "unlock";
    output.style.color = "#33CC00";
  } else {
    output.value = "lock";
    output.style.color = "#555";
  }
  
}
