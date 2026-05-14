import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Trym",
  description: "Como a Trym coleta, usa e protege seus dados pessoais.",
};

export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
      <p className="text-sm text-gray-500 mb-10">Última atualização: maio de 2026</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Quem somos</h2>
          <p>
            A Trym é uma plataforma de gestão e agendamento online. Esta política descreve como
            coletamos, usamos, armazenamos e protegemos seus dados pessoais, em conformidade com
            a LGPD (Lei Geral de Proteção de Dados — Lei 13.709/2018).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Dados que coletamos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone, dados do estabelecimento.</li>
            <li><strong>Dados de uso:</strong> agendamentos, clientes, transações e relatórios gerados na plataforma.</li>
            <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, logs de acesso.</li>
            <li><strong>Dados de pagamento:</strong> processados diretamente pelo Mercado Pago — não armazenamos dados de cartão.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Como usamos seus dados</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Prestação e melhoria do serviço contratado.</li>
            <li>Comunicações transacionais (confirmações, lembretes, suporte).</li>
            <li>Cumprimento de obrigações legais e regulatórias.</li>
            <li>Análises agregadas e anônimas para melhorar a plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Compartilhamento de dados</h2>
          <p>
            Não vendemos seus dados. Compartilhamos apenas com fornecedores essenciais à operação
            (Supabase para banco de dados, Mercado Pago para pagamentos, Resend para e-mails),
            sempre sob contratos que garantem proteção equivalente à LGPD.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Seus direitos</h2>
          <p>Conforme a LGPD, você tem direito a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Confirmar a existência de tratamento de dados.</li>
            <li>Acessar, corrigir ou excluir seus dados.</li>
            <li>Revogar o consentimento quando aplicável.</li>
            <li>Portabilidade dos seus dados.</li>
          </ul>
          <p className="mt-3">Para exercer esses direitos, envie e-mail para <strong>privacidade@trym.app</strong>.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Segurança</h2>
          <p>
            Utilizamos criptografia em trânsito (TLS) e em repouso. O acesso aos dados é
            controlado por Row Level Security no Supabase. Senhas nunca são armazenadas em texto
            puro — utilizamos o serviço de autenticação do Supabase (bcrypt).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Retenção de dados</h2>
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento, os dados
            são anonimizados ou excluídos em até 90 dias, salvo obrigação legal de retenção.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contato</h2>
          <p>
            Encarregado de dados (DPO): <strong>privacidade@trym.app</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
