google.charts.load('current', {'packages':['table','controls']});

function toggleEstado(divid) {
    var div = document.getElementById(divid);
    var disp = div.style.display;
    div.style.display = disp == 'none' ? 'flex' : 'none';
}
function mostraPopup(tipo, textoH1, textoBtn, id){
    let textoH1Form = document.getElementById('textoForm'); 

    if(tipo=='categoria')
    {
        let eventoCategoria = document.getElementById('dadosCategoriaInsere');
        eventoCategoria.removeEventListener("submit", eventoCategoria.fn,false);
        eventoCategoria.addEventListener("submit",eventoCategoria.fn=function(event){
            event.preventDefault();
            adicionarElemento(event,tipo,textoBtn,id);
        },false)
        document.getElementById('botao_enviar_categoria').value = textoBtn;
        textoH1Form.textContent= textoH1+" de "+tipo;
        toggleEstado('dadosCategoriaInsere');

    }
    else
    { 
        let eventoCategoria = document.getElementById('dadosProdutoInsere');
        eventoCategoria.removeEventListener("submit",eventoCategoria.fn,false);
        document.getElementById('botao_enviar_produto').value = textoBtn
        eventoCategoria.addEventListener("submit", eventoCategoria.fn= function(event){
            event.preventDefault();
            adicionarElemento(event,tipo,textoBtn,id);
        },false)
        textoH1Form.textContent= textoH1+" de "+tipo;
        botaoID();
        toggleEstado('dadosProdutoInsere');
    }
    toggleEstado('displayEntrada');
}
function fechaPopup(){
    formulario = document.getElementsByClassName('formularioDados');
    for(let k = 0; k<formulario.length; k++){
        formulario[k].style.display = 'none';
    }
    toggleEstado('displayEntrada');
}
function botaoID(){
    let selecao = document.getElementById('selectID');
    while (selecao.firstChild) {
        selecao.firstChild.remove();
    }
    let option=[];
    let varURL = "http://loja.buiar.com/?key=35xkr4&f=json&c=categoria&t=listar";
    let request = new XMLHttpRequest();
    request.open('GET', varURL);
    request.responseType='json';
    request.send();
    request.onload=function(){
        let dadosJson=request.response;
        for(let k=0; k<dadosJson.dados.length; k++){
            option.push(document.createElement("option"));
            option[k].text=dadosJson.dados[k].nome;
            option[k].value=dadosJson.dados[k].id;
            selecao.appendChild(option[k]);
        } 
    }
}
function listarProdutos(){
    google.charts.setOnLoadCallback(drawTable);
    let botaoAdicionarStatus = document.getElementsByClassName('botaoAdicionar');
    botaoAdicionarStatus[0].style.display = 'none';
    botaoAdicionarStatus[1].style.display = 'block';
    let divFiltro1 = document.getElementById('filter_div1');
    let divFiltro2 = document.getElementById('filter_div2');
    divFiltro1.style.display='block'; divFiltro2.style.display= 'block';

    function drawTable(){
        let varURL = "http://loja.buiar.com/?key=35xkr4&f=json&c=produto&t=listar";
        let request = new XMLHttpRequest();
        request.open('GET', varURL);
        request.responseType='json';
        request.send();
        request.onload=function(){
            let dadosJson= request.response;
            let dadosTratados=[];
            let cabecalho = Object.keys(dadosJson.dados[0]);
            let valores;
            cabecalho.push('eventos');
            dadosTratados.push(cabecalho);
            for(let i=1; i<dadosJson.dados.length;i++)
            {   
                valores = Object.values(dadosJson.dados[i]);
                
                valores.push('<input type="button" value="Remover" name='+JSON.stringify(dadosJson.dados[i].nome)+' id ='+JSON.stringify(dadosJson.dados[i].id)+'onclick="removeElementoTabela(this.id, this.name,0)"/>'
                +
                '<input type="button" value="Alterar" name='+JSON.stringify(dadosJson.dados[i].nome)+' id ='+JSON.stringify(dadosJson.dados[i].id)+' onclick="alteraCategoria(this.id, this.name)"/>');
                dadosTratados.push(valores);  
            }
            console.log(dadosTratados)
            var dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'));
            var filtro_nome = new google.visualization.ControlWrapper({
                'controlType': 'StringFilter',
                'containerId': 'filter_div1',
                'options': {
                  'filterColumnLabel': 'nome',
                  'ui': {'labelStacking': 'vertical'}
                }
              });
            var filtro_categoria = new google.visualization.ControlWrapper({
                'controlType': 'CategoryFilter',
                'containerId': 'filter_div2',
                'options': {
                    'filterColumnLabel': 'categoria',
                    'ui': {'labelStacking': 'vertical'}
                }
              });
            var tabela = new google.visualization.ChartWrapper({
                'chartType': 'Table',
                'containerId': 'displayTabela',
                'options': {
                    showRowNumber: true,
                    allowHtml: true,
                    'width': '100%'
                }
              });
            let dadosTabela=google.visualization.arrayToDataTable(dadosTratados);
            dashboard.bind([filtro_categoria,filtro_nome],tabela)
            dashboard.draw(dadosTabela);  
        }
    }
}
function adicionarElemento(e,tipo, operacao, id){
    let varURL = "http://loja.buiar.com/?key=35xkr4&f=json&c="+tipo+"&t="+operacao;
    let request = new XMLHttpRequest();
    //produto = 1, categoria = 0
    if(tipo=='produto')
    {   
        let temp = Array.from(e.target.elements);
        console.log(typeof(temp[5].value))
        for(let k=0; k<temp.length-1;k++)
            {
                if(k==5){
                    
                }
                varURL= varURL.concat('&'+temp[k].name+'=',temp[k].value);
            }
        if(operacao=='alterar')
        {
            varURL= varURL.concat("&id="+id);
        }
    }
    else
    {   
        varURL= varURL.concat('&nome='+e.target.elements.nomeCategoria.value);
        if(operacao=='alterar')
        {
            varURL= varURL.concat("&id="+id);
        }     
    }
    request.open('POST', varURL);
    request.responseType='json';
    request.send();
    request.onload=function(){
        if(request.response.status=="OK"){
            fechaPopup();
            if(tipo=='produto')
            {
                document.getElementById("dadosProdutoInsere").reset();
                listarProdutos();
            }
            else
                {
                document.getElementById("dadosCategoriaInsere").reset();
                listarCategorias();
                }
        }
        else{
            console.log('ERRO');
        }
    }
}
function listarCategorias(){
    google.charts.setOnLoadCallback(drawTable);
    let botaoAdicionarStatus = document.getElementsByClassName('botaoAdicionar');
    botaoAdicionarStatus[1].style.display = 'none';
    botaoAdicionarStatus[0].style.display = 'block';
    let divFiltro1 = document.getElementById('filter_div1');
    let divFiltro2 = document.getElementById('filter_div2');
    divFiltro1.style.display='none'; divFiltro2.style.display= 'none';

    function drawTable(){
        let varURL = "http://loja.buiar.com/?key=35xkr4&f=json&c=categoria&t=listar";
        let request = new XMLHttpRequest();
        let options={
            showRowNumber: true,
            allowHtml: true,
            'width': '100%'
        }
        request.open('GET', varURL);
        request.responseType='json';
        request.send();
        request.onload=function(){
            let dadosJson= request.response;
            let dados=[['Categoria', 'ID', 'Eventos']];
            let tabela = new google.visualization.Table(document.getElementById('displayTabela'));
    
            for(let k=0; k<dadosJson.dados.length; k++){
                dados.push([dadosJson.dados[k].nome,
                     dadosJson.dados[k].id,
                    '<input type="button" value="Remover" name='+JSON.stringify(dadosJson.dados[k].nome)+' id ='+JSON.stringify(dadosJson.dados[k].id)+'onclick="removeElementoTabela(this.id, this.name,1)"/>'
                    +
                    '<input type="button" value="Alterar" name='+JSON.stringify(dadosJson.dados[k].nome)+' id ='+JSON.stringify(dadosJson.dados[k].id)+' onclick="alteraCategoria(this.id, this.name,1)"/>']);
            }
            let dadosTabela=google.visualization.arrayToDataTable(dados);
            tabela.draw(dadosTabela, options);
        }
    }
}
function alteraCategoria(intID,nome, tipo){  
   if(tipo==1){
        mostraPopup('categoria', 'Alteração', 'alterar', intID);
    }
    else{
        mostraPopup('produto', 'Alteração', 'alterar', intID);
    } 
}
function removeElementoTabela(intID, nome, tipo){
    (tipo==1)?tipo='categoria':tipo='produto';

    let varURL = "http://loja.buiar.com/?key=35xkr4&f=json&c="+tipo+"&t=remover&id="+JSON.stringify(intID);
    let request = new XMLHttpRequest();
    request.open('POST', varURL);
    request.responseType='json';
    request.send();
    request.onload= function(){
        if(request.response.status=="OK"){
            //alert("ID: "+intID+ "\nNOME: "+nome+ " \nRemovido com sucesso");
            (tipo=='categoria')?listarCategorias():listarProdutos();
        }
        else{
            console.log('ERRO');
        }
    }
}
