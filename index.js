//特定のドメイン以外からはアクセス拒否する設定

//DOM要素が読み込まれたら開始
window.addEventListener("DOMContentLoaded", () => {
  //変数の定義
  const preview_img = document.querySelector("#preview_img");
  const local_file = document.querySelector("#local_file");
  const image_URL = document.querySelector("#image_URL");
  const transition = document.querySelector("#transition");
  const change_button = document.querySelector("#change_button");
  const textarea = document.querySelector("textarea");

  //API用変数定義
  const api_key = "AIzaSyAvH0r7uDW5oUrsNBnbTV_d1T2kuJe7gWw"; //個別アクセスkey
  const url = "https://vision.googleapis.com/v1/images:annotate?key="; //固定URL

  //ファイルが参照されたらイベント開始
  local_file.addEventListener("change", async (event) => {
    try {
      await Preview(event);
      transition.innerText = "ファイルアクセス成功！";
      await VisionAPI();
      transition.innerText = "API接続成功！";
    } catch (error) {
      console.log(error);
      textarea.innerText = "処理を中断しました。もう一度画像を置くと通信を開始します";
    }
  });

  //ファイルを読み込む
  async function Preview(event) {
    textarea.innerText = "";
    transition.innerText = "ファイルにアクセスしています......";
    await standby(2);
    const file = event.target.files[0];
    //拡張子を小文字変換
    const file_extension = file["name"].split(".").pop().toLowerCase();
    console.log(file);
    console.log(file_extension);
    //拡張子の判定
    if (file_extension != "png" && file_extension != "jpeg" && file_extension != "jpg" && file_extension != "gif") {
      transition.innerHTML = "拡張子が異なる形式です";
      return Promise.reject("拡張子が異なる形式です");
    }
    const base64Image = await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      fr.readAsDataURL(file);
    });
    await new Promise((resolve) => {
      preview_img.src = base64Image;
      resolve();
    });
  }

  //////VisionAPIへのアクセス/////
  async function VisionAPI() {
    transition.innerText = "visionAPIへのアクセスを開始します......";
    const sendbase64Image = preview_img.src.replace(/^data:image\/(png|jpeg|jpg|gif);base64,/, "");
    const requests = {
      requests: [
        {
          image: {
            content: sendbase64Image,
          },
          features: [
            {
              type: "TEXT_DETECTION", //文字認識のみを使う
            },
          ],
        },
      ],
    };

    //アクセスエラーが出たらrejectさせる
    const response = await fetch(url + api_key, {
      method: "POST",
      redirected: true,
      body: JSON.stringify(requests),
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((error) => {
      transition.innerHTML = "アクセスに失敗しました";
      return Promise.reject("アクセスエラー");
    });

    const result = await response.json();

    if (result.responses[0]["fullTextAnnotation"]) {
      //引数の要素が有ればtrue
      const text_data = result.responses[0]["fullTextAnnotation"].text;
      textarea.innerHTML = text_data;
    } else {
      transition.innerHTML = "文字は検出されませんでした";
      return Promise.reject("文字が検出されませんでした");
    }
  }
  //デザイン用、待たせるだけ
  function standby(sec) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(sec);
      }, sec * 1000);
    });
  }
});

/*旧ver
    local_file.addEventListener("change",async (e) =>{
      
      const file = e.target.files[0]; //files[0]にimageのバイナリデータが格納されている
    
      const base64Image = await new Promise((resolve) => {
        const fr = new FileReader();

        fr.onload = () =>{
          resolve(fr.result);
        };

        fr.readAsDataURL(file);
      });

      await new Promise((resolve) => {
        preview_img.src = base64Image;
        resolve();
      }).catch(error =>{
        console.log("failed open imagedata");
        textarea.innerHTML = "ファイルの読み込みに失敗しました";
      });

      //visionAPIが受け付ける形式になるよう先頭部分を空白にする
      const sendbase64Image = preview_img.src.replace(/^data:image\/(png|jpeg|jpg|gif);base64,/, '');

      const requests = {
        "requests": [
            {
                "image": {
                    "content": sendbase64Image
                },
                "features": [
                    {
                        "type": "TEXT_DETECTION" //文字認識のみを使う
                    }
                ]
            }
        ]
      };

      //ここから実際にアクセスしている
      const response = await fetch((access_key), {
        method: 'POST',
        redirected: true,
        body: JSON.stringify(requests),
        headers: {
            'Content-Type': 'application/json'
        }
      });

      //fetchで400エラーが返ってきてもcatchしてくれないので、if文で疑似的に例外処理
      const result = await response.json();
      if(result["error"]["code"] >= 400){
        console.log("accces failed"); 
        textarea.innerHTML = "アクセスに失敗しました";
      }
      
      if(!result.responses[0]["fullTextAnnotation"].text == ""){
        const text_data = result.responses[0]["fullTextAnnotation"].text;
        textarea.innerHTML = text_data;
      }else{
        console.log("get textdata failed complete"); 
        textarea.innerHTML = "文字は検出されませんでした";
      }
    });
});
*/

/*XMLHttpRequestはこれで動いた
    こちらは流れがいまいち分からなかったのでとりあえず記述した内容をメモとして残しておきます。

    const sendAPI = (base64string) => {
        let body = {
          requests: [
            {image: {content: base64string}, features: [{type: 'TEXT_DETECTION'}]}
          ]
        };
        let xhr = new XMLHttpRequest();
        xhr.open('POST', `${url}${api_key}`, true); //ここでアクセス
        xhr.setRequestHeader('Content-Type', 'application/json');
        const p = new Promise((resolve, reject) => {
          xhr.onreadystatechange = () => {
            if (xhr.readyState != XMLHttpRequest.DONE) return;
            if (xhr.status >= 400) return reject({message: `Failed with ${xhr.status}:${xhr.statusText}`});
            resolve(JSON.parse(xhr.responseText));
          };
        })
        xhr.send(JSON.stringify(body));
        return p;
      }
    
      // Read input file
      const readFile = (file) => {
        let reader = new FileReader();
        const p = new Promise((resolve, reject) => {
          reader.onload = (ev) => {
            document.querySelector('img').setAttribute('src', ev.target.result);
            resolve(ev.target.result.replace(/^data:image\/(png|jpeg|jpg|gif);base64,/, ''));
          };
        })
        reader.readAsDataURL(file);
        return p;
      };
    
      // Event handling
      document.querySelector("#local_file").addEventListener('change', ev => {
        if (!ev.target.files || ev.target.files.length == 0) return;
        Promise.resolve(ev.target.files[0])
          .then(readFile)
          .then(sendAPI)
          .then(res => {
            console.log('SUCCESS!', res);
            console.log(res.responses[0]["fullTextAnnotation"].text);
            let text_data = res.responses[0]["fullTextAnnotation"].text;
            document.querySelector('textarea').innerHTML = text_data;
          })
          .catch(err => {
            console.log('FAILED:(', err);
            document.querySelector('textarea').innerHTML = JSON.stringify(err, null,"\t");
          });
      });*/
