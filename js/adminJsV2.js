google.charts.load('current', {'packages':['table','controls']});

const fipe_URL = "https://parallelum.com.br/fipe/api/v1/carros/marcas";
const loja_categoria_URL = "http://loja.buiar.com/?key=35xkr4&f=json&c=categoria&t=listar"
const loja_produto_URL = "http://loja.buiar.com/?key=35xkr4&f=json&c=produto&t=listar"
const loja_remover_prod_URL = "http://loja.buiar.com/?key=35xkr4&f=json&c=produto&t=remover&id="
const loja_remover_cate_URL = "http://loja.buiar.com/?key=35xkr4&f=json&c=categoria&t=remover&id="
/*existe uma maneira correta de buscar pela api,  que é importando a biblioteca e instanciando uma classe do google search, mas não consegui e vai ser pela url mesmo. O "cx é a chave da search engine que é gerada pelo google clouds e a key é a chave da api também gerada vinculada com a conta google"*/
const googleSearchURL = "https://customsearch.googleapis.com/customsearch/v1?cx=57045d6ec622c4289&searchType=image&key=AIzaSyB8XoAfOHeb5aS4odsWv9yTFvc9S0GadAE&num=1&q="



var lista_produtos
var lista_categoria
var lista_marcas
var obj_veiculo;
var categoria_hash_map = new Map()
/*executa só uma vez na inicialização, pega todos os dados de forma assincrona */
const loadData = async () =>{
    const results = await Promise.all([
        fetch(loja_produto_URL),
        fetch(loja_categoria_URL),
        fetch(fipe_URL)
    ])
    const dataPromises =  results.map(result => result.json());
    const data = await Promise.all(dataPromises);
    lista_produtos = data[0];
    lista_categoria = data[1];
    lista_marcas = data[2]; 

    for(let k=0; k<lista_categoria.dados.length;k++){
        categoria_hash_map.set(lista_categoria.dados[k].id, lista_categoria.dados[k].nome)
        }

    google.charts.setOnLoadCallback(drawCategoriaChart);
    google.charts.setOnLoadCallback(drawProdutoChart);

    /*servem para preencher os campos de selecao inicial, não sabia onde colocar, coloquei aqui pq precisa esperar os request acima preencher as lista globais*/
    genericaPreencheSelection('selectCategoria',lista_categoria.dados);
    genericaPreencheSelection('selectMarca',lista_marcas, preencheSelectionNome, 'selectAnoFipe');

};loadData();
/*removendo envio automatico do formulario por url */
document.addEventListener("DOMContentLoaded", ()=>
{
    let formCategoria = document.getElementById('form_categoria');
    formCategoria.addEventListener("submit",function(event){
        event.preventDefault();
        adicionarCategoria(event);
    },false);
    let formProdutos = document.getElementById('form_produtos');
    formProdutos.addEventListener("submit",function(event){
        event.preventDefault();
        adicionarProduto(event);
    },false);

    let selecaoNome = document.getElementById('selectNomeFipe');
    selecaoNome.addEventListener('change',preencheSelectionAnoModelo)

    let selectAnoFipe = document.getElementById('selectAnoFipe');
    selectAnoFipe.addEventListener('change',preencheCampoPreco);
})

function drawProdutoChart(){
    let dadosTratados=[];
    var dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'));
            var filtro_categoria = new google.visualization.ControlWrapper({
                'controlType': 'CategoryFilter',
                'containerId': 'filtro_div_prod',
                'options': {
                    'filterColumnLabel': 'Categoria',
                    'ui': {'labelStacking': 'vertical'}
                }
              });
            var tabela = new google.visualization.ChartWrapper({
                'chartType': 'Table',
                'containerId': 'display_tabela_prod',
                'options': {
                    showRowNumber: true,
                    allowHtml: true,
                    'width': '100%'
                }
              });
    dashboard.bind([filtro_categoria],tabela);

    let cabecalho = ['Id', 'Codigo', 'Categoria', 'Nome', 'Descricao', 'Preco', 'URL ou caminho imagem', 'Peso', 'Eventos/Açoes']
    dadosTratados.push(cabecalho);
    for(let k=0; k<lista_produtos.dados.length;k++){
        let btnRemover=criaBotao("Remover", lista_produtos.dados[k].nome, lista_produtos.dados[k].id,'removerProduto');
        let btnAlterar = criaBotao("Alterar",lista_produtos.dados[k].nome, lista_produtos.dados[k].id, 'alterarProduto');
        let valores=Object.values(lista_produtos.dados[k])
        valores.push(btnRemover+btnAlterar)
        dadosTratados.push(valores);
    }
    dadosTratados=tratamentoProdutos(dadosTratados)
    let dadosTabela=google.visualization.arrayToDataTable(dadosTratados);
    dashboard.draw(dadosTabela); 
}
function drawCategoriaChart(){
  
    var tabela = new google.visualization.ChartWrapper({
        'chartType': 'Table',
        'containerId': 'displayTabela_cat',
        'options': {
            showRowNumber: true,
            allowHtml: true,
            'width': '100%'
        }
      });
    let dados=[['Categoria', 'ID', 'Eventos']];

    for(let k=0; k<lista_categoria.dados.length; k++){
        let btnRemover=criaBotao("Remover", lista_categoria.dados[k].nome, lista_categoria.dados[k].id,'removerCategoria');
        let btnAlterar = criaBotao("Alterar",lista_categoria.dados[k].nome, lista_categoria.dados[k].id, 'alterarCategoria');
        dados.push([lista_categoria.dados[k].nome,
       lista_categoria.dados[k].id, btnRemover+btnAlterar]);
    }
    let dadosTabela=google.visualization.arrayToDataTable(dados);
    google.visualization.events.addListener(tabela, 'select', function(){
        selectHandler(tabela);
    })

    tabela.setDataTable(dadosTabela);
    function selectHandler(table) {
        teste= table.getDataTable();
        var selection = table.getChart().getSelection();
        if(selection.length === 0)
            return;
        var e = event || window.event;
        var cell = e.target; //get selected cell
        if(cell.cellIndex-1 != 0)
            return;
        
        teste.setValue(selection[0].row,cell.cellIndex-1,"vidaida")
        table.setDataTable(teste);
        table.draw();
    }
    tabela.draw();
}
  
function criaBotao(value, name, id, funcName){
    return `<input type="button" class="btn btn-secondary" value=${value} name=${name} id=${id} onclick="${funcName}(this.id)"/>`
}
function tratamentoProdutos(dados2){
    var formato = { minimumFractionDigits: 2 , style: 'currency', currency: 'BRL', maximumFractionDigits: 3 }
    /*transforma o id da categoria para nome e converte em BRL o preco*/
    let dados = dados2
    for(let k=1; k<dados.length;k++){
        dados[k][2] = categoria_hash_map.get(dados[k][2])
        dados[k][5] = parseInt(dados[k][5]).toLocaleString('pt-br', formato)
    }
    return dados
}
function removerCategoria(intID){
    let varURL = loja_remover_cate_URL+JSON.stringify(intID);
    let request = new XMLHttpRequest();
    request.open('POST', varURL);
    request.responseType='json';
    request.send();
    request.onload=function(){
        atualizaLista('categoria')
    }
}
function removerProduto(intID){
    let varURL = loja_remover_prod_URL+JSON.stringify(intID);
    let request = new XMLHttpRequest();
    request.open('POST', varURL);
    request.responseType='json';
    request.send();
    request.onload=function(){
        atualizaLista('produto')
    }
}
function atualizaLista(tipo){
   
    if(tipo=='categoria'){
        fetch(loja_categoria_URL).then(res => res.json()).then(data=>{
            lista_categoria=data 
            categoria_hash_map.clear();
            for(let k=0; k<lista_categoria.dados.length;k++)
            {
            categoria_hash_map.set(lista_categoria.dados[k].id, lista_categoria.dados[k].nome)
            }
            drawCategoriaChart()
        });
    }
    else if(tipo == 'produto'){
        fetch(loja_produto_URL).then(res => res.json()).then(data=>{lista_produtos=data, drawProdutoChart()})
    }
}
function alterarCategoria(intID, tipo){
    console.log('teste', intID, tipo)
}
function adicionarCategoria(e){
    e.preventDefault();
    let varURL = "http://loja.buiar.com/?key=35xkr4&f=json&c=categoria&t=inserir&nome=";
    let temp = e.target.elements;
    varURL+=temp[0].value;
    let request = new XMLHttpRequest();
    request.open('POST', varURL);
    request.responseType='json';
    request.send();
    request.onload=function(){
        /*só adiciona o objeto a lista, não faz outra requisição xml */
        lista_categoria.dados.push({id:request.response.dados.id, nome: temp[0].value})
        drawCategoriaChart();
    }

    
}
function adicionarProduto(e)
{
    e.preventDefault();
    let varURL = "http://loja.buiar.com/?key=35xkr4&f=json&c=produto&t=inserir";
    let temp = Array.from(e.target.elements);
    var obj_backEnd = new dadosBackend(temp);
    console.log(obj_backEnd.imagem, obj_backEnd.nome)
    Object.entries(obj_backEnd).forEach(([key, value]) => 
    {
        if(key!='id' && key!='imagem')
        {
            varURL= varURL.concat('&'+key+'='+value);   
        }
    });    
    
    if(obj_backEnd.imagem==undefined || obj_backEnd.imagem ==""){
        fetch(googleSearchURL+obj_backEnd.nome).then(res => res.json()).then(data=>{
            obj_backEnd.imagem = data.items[0].link;
            varURL= varURL.concat('&imagem'+'='+obj_backEnd.imagem);
            let requestXML = new XMLHttpRequest();
            requestXML.open('POST', varURL);
            requestXML.responseType='json';
            requestXML.send();
            requestXML.onload=function()
            {
            obj_backEnd.id=requestXML.response.dados.id;
            lista_produtos.dados.push(obj_backEnd);
            drawProdutoChart();
            }
        })
    }
    else
    {   obj_backEnd.imagem = 'imagens/veiculos/'+obj_backEnd.imagem;
        varURL= varURL.concat('&imagem'+'='+obj_backEnd.imagem); 
        
        console.log(varURL)
        let request = new XMLHttpRequest();
        request.open('POST', varURL);
        request.responseType='json';
        request.send();
        request.onload=function()
        {
        obj_backEnd.id=request.response.dados.id;
        lista_produtos.dados.push(obj_backEnd);
        drawProdutoChart();
        }
    }
}
    


function genericaPreencheSelection(htmlID,lista,func){
    let selecao = document.getElementById(htmlID);
    while (selecao.firstChild) {
        selecao.firstChild.remove();
    }
    let option=[];
    for(let k=0; k<lista.length; k++){
        option.push(document.createElement("option"));
        option[k].text=lista[k].nome;
        if(lista[k].id == undefined){
            option[k].value=lista[k].codigo;
        }else{
            option[k].value=lista[k].id;
        }
    
        selecao.appendChild(option[k]);
    } 
    if(func!=undefined){
        selecao.addEventListener('change',func)
    } 
}
function preencheSelectionNome(e){ 
    let varURL = fipe_URL+"/"+e.currentTarget.value+"/modelos";
    let lista_nome_veic;
    let option = [];  
    let selecao = document.getElementById('selectNomeFipe');
    let selecao2 = document.getElementById('selectAnoFipe')

    while (selecao.firstChild) {
        selecao.firstChild.remove();
    }
    try {
        while(selecao2.firstChild){
        selecao2.firstChild.remove();
        }
        selecao2.disabled=true;
    } catch (error) {
       
    }
    selecao.disabled=false;
    /*requisição assincrona modelos, pensar de outra maneira para não precisar fazer essa requisão toda vez que atualizar a lista */
    fetch(varURL).then(res => res.json()).then(data=>{
        lista_nome_veic=data.modelos; 
        for(let k=0; k<lista_nome_veic.length; k++){
            option.push(document.createElement("option"));
            option[k].text=lista_nome_veic[k].nome;
            option[k].value=lista_nome_veic[k].codigo;
            selecao.appendChild(option[k]);
        }      
    });
    
}
function preencheSelectionAnoModelo(e){
    let selecaoMarcaFipe = document.getElementById('selectMarca')
    let selecaoNomeFipe = document.getElementById('selectNomeFipe')
    let selecaoAnoFipe = document.getElementById('selectAnoFipe')

    marcaID = selecaoMarcaFipe.options[selecaoMarcaFipe.selectedIndex].value;
    nomeID= selecaoNomeFipe.options[selecaoNomeFipe.selectedIndex].value;
    let lista_ano_veic;
    let option = []; 
    let varURL = fipe_URL+"/"+marcaID+"/modelos/"+nomeID+"/anos";

    while (selecaoAnoFipe.firstChild) {
        selecaoAnoFipe.firstChild.remove();
    }
    selecaoAnoFipe.disabled=false;
    fetch(varURL).then(res => res.json()).then(data=>{
        lista_ano_veic = data;
        for(let k=0; k<lista_ano_veic.length; k++){
            option.push(document.createElement("option"));
            option[k].text=lista_ano_veic[k].nome;
            option[k].value=lista_ano_veic[k].codigo;
            selecaoAnoFipe.appendChild(option[k]);
        }   
    })
}
function preencheCampoPreco(e){
    let selecaoMarcaFipe = document.getElementById('selectMarca')
    let selecaoNomeFipe = document.getElementById('selectNomeFipe')
    let selecaoAnoFipe = document.getElementById('selectAnoFipe')
    let selecaoPrecoFipe = document.getElementById('selectPrecoFipe')
    
    marcaID = selecaoMarcaFipe.options[selecaoMarcaFipe.selectedIndex].value;
    nomeID= selecaoNomeFipe.options[selecaoNomeFipe.selectedIndex].value;
    anoID =selecaoAnoFipe.options[selecaoAnoFipe.selectedIndex].value;

    let varURL = fipe_URL+"/"+marcaID+"/modelos/"+nomeID+"/anos/"+anoID;

    fetch(varURL).then(res => res.json()).then(data=>{
        obj_veiculo = data;
        selecaoPrecoFipe.value=obj_veiculo.Valor;
    })
}
//teste
class dadosBackend{
    constructor(arrayForm){
        this.id=null;
        this.codigo=arrayForm[5].value;
        this.categoria=arrayForm[4].value;
        this.nome=arrayForm[1].options[arrayForm[1].selectedIndex].textContent;
        //usei o objeto global ao invés do formulario, pode dar problema
        this.descricao=obj_veiculo.Marca+", Ano modelo: "+obj_veiculo.AnoModelo+ ", Combustível: "+obj_veiculo.Combustivel+", "+arrayForm[9].value;
         //todo
        this.preco=parseFloat(arrayForm[3].value.split('R$ ')[1].split('.').join('').split(',').join('.'));
        this.imagem = arrayForm[7].value.split('\\')[2]
        //
        this.peso=arrayForm[6].value;
    }
}