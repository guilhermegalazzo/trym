import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — Trym",
  description: "Termos e condições de uso da plataforma Trym.",
};

export default function TermosPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
      <p className="text-sm text-gray-500 mb-10">Última atualização: maio de 2026</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
          <p>
            Ao criar uma conta ou utilizar a plataforma Trym, você concorda com estes Termos de Uso.
            Se não concordar, não utilize o serviço. A Trym reserva o direito de alterar estes
            termos a qualquer momento, com aviso prévio por e-mail ou notificação no painel.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descrição do Serviço</h2>
          <p>
            A Trym é uma plataforma SaaS de gestão e agendamento online voltada para profissionais
            e estabelecimentos dos segmentos de beleza, pet e fitness no Brasil. O serviço inclui
            agenda digital, gestão de clientes, controle de caixa, relatórios e página de booking
            público.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Cadastro e Conta</h2>
          <p>
            Para utilizar o painel de gestão, você deve criar uma conta com informações verdadeiras
            e mantê-las atualizadas. Você é responsável pela confidencialidade de sua senha e por
            todas as atividades realizadas em sua conta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Planos e Pagamento</h2>
          <p>
            O acesso ao painel de gestão está sujeito a assinatura mensal conforme os planos
            disponíveis. Os valores e condições de pagamento são exibidos na página de preços.
            O não pagamento pode resultar na suspensão do acesso.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Dados dos Clientes</h2>
          <p>
            Você é o controlador dos dados pessoais de seus clientes armazenados na Trym. A Trym
            atua como operadora de dados e processa essas informações apenas para prestar o serviço
            contratado, em conformidade com a LGPD (Lei 13.709/2018).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitação de Responsabilidade</h2>
          <p>
            A Trym não se responsabiliza por danos indiretos decorrentes do uso ou impossibilidade
            de uso do serviço. A responsabilidade total da Trym está limitada ao valor pago pelo
            usuário nos últimos 3 meses.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Rescisão</h2>
          <p>
            Você pode cancelar sua assinatura a qualquer momento pelo painel. A Trym pode suspender
            ou encerrar contas que violem estes termos, com ou sem aviso prévio, dependendo da
            gravidade da violação.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Foro e Lei Aplicável</h2>
          <p>
            Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
            foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contato</h2>
          <p>
            Dúvidas sobre estes termos? Entre em contato: <strong>legal@trym.app</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
