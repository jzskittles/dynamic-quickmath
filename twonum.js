var result=0;
        var streaknum = 0;
        
        var languages = window.location.hash.substring(1);
        var buttons = document.getElementsByTagName("button");
        for(i=0; i<buttons.length; i++){
            if(buttons[i].id=="enter"){
                if(languages=="en")
                    buttons[i].textContent="ENTER";
                else
                    buttons[i].textContent="抢答";
            }
        }
        function addText(clicked_id) {
            if(document.getElementById("answer").textContent.length<12)
                document.getElementById("answer").textContent = document.getElementById("answer").textContent + clicked_id;
        }
        function removeText(){
            if(document.getElementById("answer").textContent.length>2){
                var str = document.getElementById("answer").textContent;
                str = str.substring(0, str.length - 1);
                document.getElementById("answer").textContent = str;
            }    
        }
        function randomNum(){
            var a = Math.floor((Math.random() * 100) + 1);
            var b = Math.floor((Math.random() * 100) + 1);

            var c=0;
            if(((Math.random()*100) + 1)>50)
                c = 1;

            var probtable = document.getElementById("probtable");
            var items = probtable.getElementsByTagName("h2");
            if(c==0){
                items[1].textContent="+";
                result = a+b;
            }else{
                items[1].textContent="-";
                if(b>a){
                    var m = a;
                    a = b;
                    b = m;
                }
                result = a-b;
            }

            items[0].textContent = a;
            items[2].textContent = b;
        }
        function compare(){
            var answers = document.getElementById("answer").textContent;
            
            if(answers.substring(2) == result){
                streaknum++;
            }else{
                streaknum=0;
            }
            document.getElementById("streak").textContent = streaknum;
            document.getElementById("answer").textContent = "= ";

            randomNum();
        }
        function back(){
            window.location.href = "index.html"+"#"+languages;
        }
        randomNum();
        window.onbeforeunload = function (evt) {
            window.location.href = "index.html"+"#"+languages;
        }