# Campanha de financiamento coletivo — Português (Brasil)

*Pronto para Catarse. Os valores estão em euros porque o material é comprado na
Europa; a conversão para reais deve ser indicada no dia do lançamento, com o
câmbio daquele dia.*

---

## Título

**Captar a faísca — um exoesqueleto open source nascido de uma lesão C6-C7**

Alternativas:
- « Ainda me resta um sinal. Quero devolvê-lo ao movimento. »
- « Da Amazônia à neuro-robótica: um exoesqueleto de código aberto »

## Chamada curta

> Uma lesão medular incompleta não apaga tudo: quando mando minhas pernas se
> moverem, eu sinto o impulso descer. Este projeto capta esse sinal residual e o
> devolve ao movimento — em código aberto.

---

## A história

### O que eu ainda sinto

Em 2016, um acidente de carro. Lesão medular **C6-C7 incompleta**.
O laudo descreve o que não funciona mais. Não descreve o que eu sinto todos os
dias: **a ordem de mover ainda parte**, e desce. Nem sempre chega ao músculo. Mas
existe, e é mensurável.

É aí que tudo começa. Não numa teoria, numa sensação.

### O que a floresta ensinou antes

Antes do acidente fui *garimpeiro* e guia, organizador de expedições na floresta
amazônica das três Guianas. Lá se aprende três coisas que não se aprendem em
outro lugar: **ler o terreno**, **decidir com informação incompleta** e **sair de
novo no dia seguinte**, mesmo quando o dia deu errado.

Pesquisa e desenvolvimento é muito parecido. Só que aqui o terreno é um sistema
nervoso.

### O que estou construindo

Um **exoesqueleto de assistência em malha fechada**, com dois níveis:

- **« O Rápido »** — o laço duro, **abaixo de 20 ms**, vestido pela pessoa:
  aquisição de EMG com isolação galvânica, detecção de intenção, comando dos
  motores por barramento CAN, estimulação elétrica funcional (FES) com janela de
  *blanking* para não cegar a medição, e parada reflexa por hardware.
- **« O Pensador »** — o nível alto, fora da pessoa: gêmeo digital 3D (MuJoCo,
  Isaac Sim conforme a GPU), registro e reexecução de sessão. Ligado ao posto de
  campo por um túnel privado **Tailscale**, sem abrir nenhuma porta.

**O Pensador nunca comanda um motor.** É a regra que torna o sistema seguro: se a
rede cair, a pessoa continua num estado controlado.

### O que o dinheiro financia — e o que não financia

**Nenhum modelo de IA nesta fase.** As interfaces estão prontas — tópicos ROS 2,
estruturas de mensagem, espaços de módulo — para que os modelos entrem depois sem
reescrever a arquitetura. Não se está vendendo uma promessa de inteligência; está
se financiando uma bancada de testes honesta.

---

## Justificativa técnica: por que treinar em 3D antes de usinar

1. **Um exoesqueleto mal ajustado machuca.** A cinemática de quadril e joelho
   assistidos depende da morfologia: comprimentos de segmento, alinhamento dos
   eixos, curso útil. Testar isso numa máquina física é usinar uma peça por
   tentativa. No simulador, é mudar um número.
2. **O laço precisa ser ajustado antes de ser perigoso.** Limiar de detecção de
   intenção, latência, rampa de torque: tudo isso se ajusta em trajetórias
   reexecutadas, com medidas reprodutíveis. Numa pessoa, cada tentativa custa
   fadiga e risco.
3. **O gêmeo digital se torna o arquivo.** Cada sessão gravada é reexecutável: se
   uma assistência funciona, dá para dizer por quê, e reproduzir. Sem isso, sobram
   impressões, não resultados.

A usinagem vem depois, sobre cotas validadas. Mais lento no começo e muito mais
rápido em seguida.

---

## Repartição dos 1 350 € — Fase 1 « laboratório nômade »

| Item | Detalhe | Estimativa |
|---|---|---|
| Placa de aquisição | OpenBCI Cyton, 8 canais, EEG/EMG | 620 € |
| Eletrodos e consumíveis | eletrodos + gel + cabos | 80 € |
| Sensores EMG de campo | 2 × MyoWare 2.0 + cablagem | 150 € |
| Dock Thunderbolt 3 | alimentação + portas para posto móvel | 180 € |
| Monitores | 2 monitores adicionais (três telas) | 320 € |
| **Total** | | **1 350 €** |

*Estimativas a confirmar por orçamento. Taxas da plataforma e envio de
recompensas não incluídos.*

---

## Metas estendidas

| Meta | O que libera |
|---|---|
| **1 800 €** | Sensores de segurança: IMU BNO085 ×2, LiDAR LD19, radar mmWave RD-03D |
| **2 500 €** | Fonte isolada + bancada de medição: primeira validação elétrica séria |
| **4 000 €** | Primeiro atuador: motor BLDC + redutor + driver CAN, bancada a vazio |
| **6 000 €** | Módulo FES e eletrônica de blanking — a etapa que muda a natureza do projeto |

Cada meta atingida é anunciada, documentada e publicada — inclusive quando falha.

---

## Recompensas (todas imateriais)

| Valor | Recompensa |
|---|---|
| **5 €** | Agradecimento nominal nos créditos do repositório e no site |
| **15 €** | Acesso ao **diário de bordo** semanal: o que funcionou, o que quebrou, as cotas erradas |
| **30 €** | **Pacote de esquemas** em alta resolução, sob licença aberta, assim que existirem |
| **60 €** | Videoconferência mensal de 30 min: perguntas técnicas sem filtro |
| **120 €** | Seu nome na **placa do protótipo** + voto nas prioridades do mês seguinte |
| **250 €** | Oficina de uma hora para sua instituição (associação, escola, fablab) |
| **500 €** | Nome da instituição na página de parceiros e em cada relatório de fase |

**O que eu não prometo:** nenhuma recompensa médica, nenhum acesso privilegiado a
dispositivo, nenhuma garantia de resultado clínico. Seria desonesto e perigoso.

---

## Cronograma

| Quando | O quê |
|---|---|
| Imediato | Concepção, análise de riscos, escolha de componentes (repositório público) |
| +1 mês | Material recebido, primeiras aquisições de EMG, medidas brutas publicadas |
| +3 meses | Laço do Sistema 1 em bancada: sensor → intenção → atuador simulado, latência medida |
| +6 meses | Arnês passivo e pórtico, sensores de segurança instalados |

---

## Transparência

- **Código e desenhos são públicos** desde que existem, mesmo imperfeitos.
- **As medidas brutas são publicadas**, inclusive as que contradizem minhas hipóteses.
- **Os fracassos são contados.** Um projeto de saúde que só mostra acertos não
  informa ninguém.
- **Nenhum ensaio em pessoa** sem análise de riscos escrita, validação elétrica,
  supervisão clínica e parecer de ética.

---

## O que eu peço, e por que agora

O material da Fase 1 é o que separa uma ideia de uma bancada de testes. A partir
daí tudo se torna mensurável — e o que é mensurável se corrige.

**Acompanhe desde agora.** Mesmo sem contribuir: um projeto aberto de
reabilitação neuro-robótica só existe se as pessoas olharem o que ele produz.
