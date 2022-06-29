var btn = document.getElementById("buscaPedido");
var requestUrl;
var id;

function buscaPedido(){ 
    formaURL();
    var request = new XMLHttpRequest();
    request.open('GET', requestUrl);
    request.responseType = 'json';
    request.send();
    request.onload = function(){
        var dados = request.response;
        exibePedidos(dados);
    }

}

function formaURL(){
    requestUrl = "http://loja.buiar.com/?key=35xkr4&f=json&c=pedido&t=listar&id="
    id = document.getElementById("idBusca");
    requestUrl = requestUrl+id.value;

    var text = document.getElementById("idBusca");
}
 
function exibePedidos(e){
    var div = document.getElementById("pedidos");

    for(let i=0; i< e.dados.length; i++){
       if(id.value == e.dados[i].id){ 
          var div = document.getElementById("pedidos");
          var boleto = document.createElement("a");
          var botao = document.createElement("button");

          var texto = document.createElement("p");
          texto.innerText = textoPadrao(e,i);
          div.appendChild(texto);  
    

          botao.setAttribute("value","Baixar boleto");
          boleto.setAttribute("href",geraBoleto());
          boleto.setAttribute("target","_blank");
          boleto.setAttribute("download","boleto.pdf");
          botao.innerText = "Baixar boleto";
          boleto.appendChild(botao);
          div.appendChild(boleto);
         
       }
    }
}

function geraBoleto(){
    var boletoGerado = "http://loja.buiar.com/?key=35xkr4&f&c=boleto&t=listar&id="
    boletoGerado = boletoGerado + id.value
    console.log(boletoGerado);
    return boletoGerado;
}


function textoPadrao(e,i){
    console.log(e.dados[i].rua)
    var texto = "Olá " + e.dados[i].nome + "! Obrigado por comprar conosco. O pedido número " + e.dados[i].id + " está sendo preparado para ser entregue no endereço " + e.dados[i].rua + ", número " + e.dados[i].numero + ". O prazo de entrega é de 7 dias úteis."
    return texto;
}
