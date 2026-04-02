import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function LegalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'privacidade';

  const tabs = [
    { id: 'privacidade', title: 'Política de Privacidade (LGPD)' },
    { id: 'termos', title: 'Termos e Condições de Uso' },
    { id: 'trocas', title: 'Trocas e Devoluções' },
    { id: 'entregas', title: 'Fretes e Entregas' },
    { id: 'seguranca', title: 'Segurança nas Transações' },
  ];

  // Rola para o topo sempre que trocar de aba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);

  return (
    <div className="bg-fundo min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
        
        {/* Sidebar Navigation */}
        <aside className="md:w-1/4">
          <div className="sticky top-32">
            <h2 className="font-serif text-3xl font-bold text-secundaria mb-6">Central Legal</h2>
            <nav className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={`text-left px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                    currentTab === tab.id
                      ? 'bg-secundaria text-white shadow-md'
                      : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-secundaria border border-gray-100'
                  }`}
                >
                  {tab.title}
                </button>
              ))}
            </nav>
            <div className="mt-8 p-6 bg-primaria/5 rounded-2xl border border-primaria/10">
              <p className="text-xs font-bold text-secundaria uppercase tracking-widest mb-2">Dúvidas?</p>
              <p className="text-sm text-gray-500 mb-4">Estamos à disposição para esclarecer qualquer ponto das nossas políticas.</p>
              <a href="mailto:ola@cameliahandcraft.com.br" className="text-primaria font-bold text-sm tracking-wide hover:underline">
                ola@cameliahandcraft.com.br
              </a>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="md:w-3/4 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
          <div className="prose prose-sm sm:prose-base max-w-none text-gray-600 text-justify leading-relaxed">
            
            {/* 1. Privacidade */}
            {currentTab === 'privacidade' && (
              <section className="animate-fade-in-down">
                <h1 className="text-3xl font-serif font-bold text-secundaria mb-8">Política de Privacidade</h1>
                <p>A <strong>Camélia Handcraft</strong> valoriza a sua privacidade e garante a segurança dos seus dados pessoais com base na <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>.</p>
                
                <h3 className="text-xl font-bold text-secundaria mt-8 mb-4">1. Coleta de Dados</h3>
                <p>Coletamos os dados estritamente necessários para o processamento do seu pedido e entrega: Nome completo, CPF, E-mail, Telefone/WhatsApp e Endereço de entrega. Estas informações são criptografadas e armazenadas em servidores seguros de banco de dados globais.</p>
                
                <h3 className="text-xl font-bold text-secundaria mt-8 mb-4">2. Finalidade e Compartilhamento</h3>
                <p>A finalidade exclusiva dos seus dados é faturar e expedir os seus produtos artesanais, além de nos comunicarmos com você sobre o status da compra. Compartilhamos seus dados básicos <strong>apenas</strong> com:</p>
                <ul className="list-disc pl-5 my-4 space-y-2">
                  <li>Nossos <strong>parceiros de frete (Transportadoras/Correios)</strong> para emissão da etiqueta de envio;</li>
                  <li>Nossa parceira global de pagamentos, a <strong>Stripe</strong>, que recebe e valida as suas transações anonimamente em conformidade com o padrão internacional de segurança PCI (Payment Card Industry).</li>
                </ul>
                
                <h3 className="text-xl font-bold text-secundaria mt-8 mb-4">3. Direitos do Titular</h3>
                <p>Você pode acessar sua Conta no nosso site para alterar e atualizar as suas informações a qualquer momento. Caso deseje a exclusão permanente e completa dos seus dados da nossa base (Direito ao Esquecimento), por favor, solicite formalmente pelo e-mail <strong>ola@cameliahandcraft.com.br</strong>.</p>
              </section>
            )}

            {/* 2. Termos e Condições */}
            {currentTab === 'termos' && (
              <section className="animate-fade-in-down">
                <h1 className="text-3xl font-serif font-bold text-secundaria mb-8">Termos e Condições de Uso</h1>
                <p>Estes Termos e Condições são um contrato estabelecido entre a <strong>Camélia Handcraft</strong> e o usuário/cliente. Ao realizar cadastros e compras neste site, você atesta sua concordância irrestrita com estas cláusulas.</p>
                
                <h3 className="text-xl font-bold text-secundaria mt-8 mb-4">1. Produtos Artesanais</h3>
                <p>A Camélia Handcraft produz itens exclusivos de mesa posta. Por se tratar de um trabalho artesanal minucioso, pequenas variações de cor, tramas ou milímetros nominais podem ocorrer em relação às fotos exibidas (que possuem iluminação de estúdio). Essas mínimas diferenças atestam a natureza humana e a autenticidade inigualável do modelo.</p>
                
                <h3 className="text-xl font-bold text-secundaria mt-8 mb-4">2. Disponibilidade e Preços</h3>
                <p>Os produtos exibidos estão limitados ao estoque virtual. A Camélia Handcraft reserva-se o direito de alterar os preços do seu portfólio a qualquer momento sem aviso prévio, salvaguardando sempre as compras que já tiverem sido concluídas e pagas antes da respectiva atualização. O valor do frete não está incluso no preço de vitrine e é sempre somado no momento do checkout mediante a análise de CEP da sua região.</p>

                <h3 className="text-xl font-bold text-secundaria mt-8 mb-4">3. Cadastro Protegido</h3>
                <p>O cliente é inteiramente responsável por informar sua titularidade exata e o endereço de entrega corretamente sem erros de digitação (bairro, quadra, numeração). A Camélia Handcraft está isenta em casos de pacotes que não chegam ao destino porque o cliente forneceu um endereço incompleto ou nulo no ato da confirmação.</p>
              </section>
            )}

            {/* 3. Trocas e Devoluções */}
            {currentTab === 'trocas' && (
              <section className="animate-fade-in-down">
                <h1 className="text-3xl font-serif font-bold text-secundaria mb-8">Trocas e Devoluções</h1>
                <p>De acordo com o nosso compromisso com a satisfação do cliente e com o <strong>Código de Defesa do Consumidor (CDC)</strong>, instituímos uma política de trocas clara para as nossas peças de luxo.</p>

                <h3 className="text-xl font-bold text-secundaria mt-8 mb-4">1. Direito de Arrependimento</h3>
                <p>Nas compras online, o cliente tem até <strong>07 (sete) dias corridos</strong> após o ato de recebimento do pacote (apontado pelo rastreio) para manifestar desistência do produto, mesmo sem justificativa (Art. 49). O requerimento deve ser feito ao e-mail <strong>ola@cameliahandcraft.com.br</strong> e o valor da peça é reembolsado ao retornar à loja.</p>
                
                <h3 className="text-xl font-bold text-secundaria mt-8 mb-4">2. Defeito de Fabricação</h3>
                <p>Se a peça chegar avariada em sua residência, peçamos que fotografe o item na própria embalagem ao desembalar. Envie um e-mail para nós dentro do prazo de até 30 dias de acordo com o CDC. A nossa equipe irá realizar a avaliação. Verificado o dano estrutural acidental ou de confecção, **todas as despesas do envio e reenvio logístico de substituição serão cobertas por nossa conta**.</p>
                
                <h3 className="text-xl font-bold text-secundaria mt-8 mb-4">3. Troca e Logística por Escolha ou Desistência</h3>
                <p>Para demandas de desistência ou solicitação de trocas envolvendo modelo, numeração cor e similares (trocas de gosto não motivadas por defeitos de fábrica), **salientamos que os custos do frete reverso até a base de expedição da Camélia deverão ser inteiramente pagos pelo cliente**. A embalagem de retorno deve garantir proteção extra à peça (preferencialmente na própria caixa Camélia em que chegou), a fim de prevenir recusas na análise de integridade ao recebê-la em nosso ateliê.</p>
              </section>
            )}

            {/* 4. Fretes e Entregas */}
            {currentTab === 'entregas' && (
              <section className="animate-fade-in-down">
                <h1 className="text-3xl font-serif font-bold text-secundaria mb-8">Políticas Logísticas de Envio</h1>
                <p>Nosso atelier segue processos bem estruturados de amor contínuo a cada peça pronta.</p>

                <h3 className="text-xl font-bold text-secundaria mt-8 mb-4">1. Prazo de Preparo e Postagem Padrão</h3>
                <p>Para garantir a acomodação rigorosa da peça e a montagem minuciosa da sua caixa com papéis e aroma Camélia, o nosso prazo operacional de processamento no ateliê e posterior entrega do correio é estabelecido em <strong>D+1</strong> (exatamente <strong>1 dia útil após a confirmação do pagamento</strong> via cartão ou PIX). Compras aos sábados e domingos contam seu faturamento no primeiro dia útil subsequente da semana.</p>

                <h3 className="text-xl font-bold text-secundaria mt-8 mb-4">2. Prazos Oficiais de Trânsito</h3>
                <p>O tempo para o pacote chegar até a sua porta dependerá puramente da distância do seu CEP à nossa origem, e da modalidade de entrega selecionada (PAC, Transportadora Logística Rodoviária ou SEDEX). Essa data de chegada esperada é descrita automaticamente perante sua visão dentro da finalização do Carrinho/Checkout no site.</p>

                <h3 className="text-xl font-bold text-secundaria mt-8 mb-4">3. Tratativas de Ausências Residenciais</h3>
                <p>Ao realizar sua compra sob prestação de serviço em nosso site, certifique-se que o local em horário comercial (seg a sex, 08h-18h) terá suporte humano que atenda aos Correios para a assinatura do recebimento de caixa. São realizadas, normalmente, de 2 a 3 tentativas. Esgotadas estas, os Correios devolvem o pacote à remetente Camélia e o reenvio demandará um novo pagamento da fração logística sob custeio do titular do pedido que se responsabilizou pela morada. Daremos amplo suporte por e-mail ou telefone para resolver o impasse caso necessário.</p>
              </section>
            )}

            {/* 5. Segurança */}
            {currentTab === 'seguranca' && (
              <section className="animate-fade-in-down">
                <h1 className="text-3xl font-serif font-bold text-secundaria mb-8">Integridade Bancária e Segurança</h1>
                <p>Nós da <strong>Camélia Handcraft</strong> não compactuamos com fragilidades digitais e não nos arriscamos em servidores paralelos.</p>

                <div className="flex flex-col md:flex-row gap-6 my-8">
                  <div className="bg-emerald-50 p-6 rounded-2xl flex-1 border border-emerald-100">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-600 mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                    <h4 className="font-bold text-emerald-800 uppercase tracking-widest text-xs mb-2">Checkout Blindado (Pontões)</h4>
                    <p className="text-sm text-emerald-700">A página final on-line onde se insere os dados sigilosos possui encriptação TLS completa, garantindo barreira impossível de visualizar entre o cliente e nossa rede.</p>
                  </div>

                  <div className="bg-[#635BFF]/10 p-6 rounded-2xl flex-1 border border-[#635BFF]/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#635BFF] mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
                    <h4 className="font-bold text-[#635BFF] uppercase tracking-widest text-xs mb-2">Pagamento Via Stripe</h4>
                    <p className="text-sm text-[#4A43D1]">Transacionamos diretamente conectando a sua sessão dentro da segurança máxima da Stripe Corporation, sediada nos EUA. A Camélia Handcraft <strong>nunca guarda os seus números de cartão de crédito</strong> no banco de dados.</p>
                  </div>
                </div>

                <p>Nossa plataforma se abstém de enviar promoções via SPAM ou de tentar negociar transações do lado de fora em contas de supostos funcionários.</p>
                <p>Dessa forma, prezamos pela tranquilidade nas vitrines de uma verdadeira loja de autoridade em luxo têxtil artesanal na internet.</p>
              </section>
            )}

          </div>
        </main>

      </div>
    </div>
  );
}

export default LegalPage;
