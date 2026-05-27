export type ManualRole = 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'COMUNICACAO';
export type ManualCardId = 'secretaria' | 'professor' | 'comunicacao' | 'administrador';

export interface ManualArquivo {
  titulo: string;
  descricao: string;
  arquivo: string;
  nomeArquivo: string;
  cardIds: ManualCardId[];
  roles: ManualRole[];
  conteudo?: ManualConteudoAcessivel;
}

export interface ManualCard {
  id: ManualCardId;
  titulo: string;
  descricao: string;
  icon: string;
  cor: string;
  arquivo: string | null;
  roles: ManualRole[];
}

export interface ManualConteudoAcessivel {
  introducao: string[];
  secoes: ManualSecaoAcessivel[];
}

export interface ManualSecaoAcessivel {
  titulo: string;
  textos: string[];
  itens?: string[];
  alerta?: string;
}

export interface TecnologiaItem {
  nome: string;
  icon: string;
  descricao: string;
}

export interface EquipeItem {
  nome: string;
  papel: string;
  github: string;
}

export const MANUAIS_AJUDA: ManualCard[] = [
  {
    id: 'secretaria',
    titulo: 'Guia da Secretaria',
    descricao: 'Como cadastrar alunos, gerenciar matrículas em oficinas e controlar frequências.',
    icon: 'badge',
    cor: 'primary',
    arquivo: null,
    roles: ['SECRETARIA', 'ADMIN']
  },
  {
    id: 'professor',
    titulo: 'Guia do Professor',
    descricao: 'Como acessar o diário de classe, registrar presença e encerrar chamadas.',
    icon: 'school',
    cor: 'info',
    arquivo: null,
    roles: ['PROFESSOR', 'ADMIN']
  },
  {
    id: 'comunicacao',
    titulo: 'Guia da Comunicação',
    descricao: 'Como publicar comunicados, gerenciar notícias, eventos e o conteúdo do site institucional.',
    icon: 'campaign',
    cor: 'warning',
    arquivo: null,
    roles: ['COMUNICACAO', 'ADMIN']
  },
  {
    id: 'administrador',
    titulo: 'Guia do Administrador',
    descricao: 'Emissão de certificados, gestão de apoiadores, comunicados e configurações do sistema.',
    icon: 'admin_panel_settings',
    cor: 'success',
    arquivo: null,
    roles: ['ADMIN']
  }
];

/*
 * Para adicionar novos PDFs:
 * 1. Coloque o arquivo em src/assets/manuais.
 * 2. Cadastre o PDF abaixo uma unica vez.
 * 3. Em cardIds, informe em quais cards ele deve aparecer.
 * 4. Em roles, informe quem pode ver. ADMIN ve todos automaticamente.
 */
export const ARQUIVOS_MANUAIS_AJUDA: ManualArquivo[] = [
  {
    "titulo": "Cadastrar aluno",
    "descricao": "Passo a passo para cadastrar um aluno no sistema.",
    "arquivo": "/assets/manuais/cadastrar_aluno.pdf",
    "nomeArquivo": "cadastrar_aluno.pdf",
    "cardIds": [
      "secretaria",
      "administrador"
    ],
    "roles": [
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a registrar um novo aluno no sistema administrativo.",
        "Use esta funcionalidade quando a pessoa ainda não possui cadastro ativo no sistema."
      ],
      "secoes": [
        {
          "titulo": "Acessar o cadastro",
          "textos": [
            "No menu administrativo, acesse Alunos.",
            "Selecione o botão Novo Aluno.",
            "O sistema abrirá um formulário em etapas."
          ]
        },
        {
          "titulo": "Preencher os dados",
          "textos": [
            "Informe os dados pessoais do aluno.",
            "Preencha CPF, RG, data de nascimento, gênero, cor ou raça e estado civil.",
            "Avance para preencher endereço, contato e dados de emergência.",
            "Depois, informe os dados sobre deficiência visual, acessibilidade, saúde, escolaridade e renda."
          ],
          "itens": [
            "Use a opção S/N quando o endereço não tiver número.",
            "Marque Possui laudo médico somente quando houver laudo para anexar.",
            "Informe telefone de contato e contato de emergência sempre que possível."
          ],
          "alerta": "Campos obrigatórios precisam ser preenchidos antes de avançar ou concluir o cadastro."
        },
        {
          "titulo": "Concluir o cadastro",
          "textos": [
            "Revise as informações antes de finalizar.",
            "Selecione o botão Concluir Cadastro.",
            "Se o CPF pertencer a um aluno inativo, o sistema poderá oferecer a reativação do cadastro."
          ],
          "alerta": "Arquivos anexados, como laudo e termo LGPD, devem respeitar o limite aceito pelo sistema."
        }
      ]
    }
  },
  {
    "titulo": "Gerenciar alunos",
    "descricao": "Passo a passo para consultar e administrar alunos cadastrados.",
    "arquivo": "/assets/manuais/gerenciar_alunos.pdf",
    "nomeArquivo": "gerenciar_alunos.pdf",
    "cardIds": [
      "secretaria",
      "administrador"
    ],
    "roles": [
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a localizar, filtrar, editar, inativar e consultar alunos.",
        "Use esta funcionalidade para manter os cadastros atualizados."
      ],
      "secoes": [
        {
          "titulo": "Consultar alunos",
          "textos": [
            "No menu administrativo, acesse Alunos.",
            "Use o campo Buscar por nome ou matrícula para localizar um aluno.",
            "Use as abas Ativos e Inativos para alternar entre cadastros ativos e inativados.",
            "Use o botão Filtros para buscar por deficiência, cidade, UF, escolaridade, renda e outros critérios."
          ]
        },
        {
          "titulo": "Abrir e editar cadastro",
          "textos": [
            "Na linha do aluno, selecione Editar para alterar os dados cadastrais.",
            "Selecione Ver para abrir o perfil completo do aluno.",
            "No perfil, consulte dados pessoais, documentos, PDI, linha do tempo e histórico relacionado."
          ],
          "itens": [
            "Use Imprimir ficha para abrir a impressão da ficha do aluno.",
            "Use Ver ou Editar nos documentos para visualizar ou substituir arquivos cadastrados."
          ]
        },
        {
          "titulo": "Inativar ou restaurar aluno",
          "textos": [
            "Na aba Ativos, selecione Inativar para remover o aluno da lista ativa.",
            "Na aba Inativos, selecione Restaurar para reativar o aluno.",
            "Também é possível excluir definitivamente um aluno inativo."
          ],
          "alerta": "A exclusão definitiva remove o cadastro de forma permanente. Use somente quando tiver certeza."
        }
      ]
    }
  },
  {
    "titulo": "Importar alunos por planilha",
    "descricao": "Passo a passo para importar alunos em lote por planilha.",
    "arquivo": "/assets/manuais/importar_alunos_por_planilha.pdf",
    "nomeArquivo": "importar_alunos_por_planilha.pdf",
    "cardIds": [
      "secretaria",
      "administrador"
    ],
    "roles": [
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a importar vários alunos usando uma planilha.",
        "Use esta funcionalidade quando houver muitos cadastros para registrar de uma só vez."
      ],
      "secoes": [
        {
          "titulo": "Abrir a importação",
          "textos": [
            "No menu administrativo, acesse Alunos.",
            "Selecione o botão Importar Planilha.",
            "O sistema abrirá o modal Importar Alunos via Planilha."
          ]
        },
        {
          "titulo": "Preparar e selecionar a planilha",
          "textos": [
            "Selecione Baixar modelo para usar a estrutura esperada pelo sistema.",
            "Preencha a planilha seguindo o modelo.",
            "No modal, selecione a área de envio e escolha o arquivo da planilha."
          ],
          "alerta": "Use o modelo disponibilizado pelo sistema para evitar falhas de leitura."
        },
        {
          "titulo": "Processar a importação",
          "textos": [
            "Selecione Processar Importação.",
            "Acompanhe o progresso de leitura e importação no modal.",
            "Ao final, confira a quantidade de alunos importados e os erros encontrados.",
            "Selecione Concluir para fechar o modal."
          ],
          "itens": [
            "Se houver erros, revise as linhas indicadas na tabela de detalhes.",
            "Depois de corrigir a planilha, envie o arquivo novamente."
          ]
        }
      ]
    }
  },
  {
    "titulo": "Criar turma ou oficina",
    "descricao": "Passo a passo para criar uma turma ou oficina no sistema.",
    "arquivo": "/assets/manuais/criar_turma_oficina.pdf", 
    "nomeArquivo": "criar_turma_oficina.pdf",
    "cardIds": [
      "secretaria",
      "administrador"
    ],
    "roles": [
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a cadastrar uma turma ou oficina.",
        "Use esta funcionalidade para organizar alunos, professor responsável, período e grade horária."
      ],
      "secoes": [
        {
          "titulo": "Abrir o formulário",
          "textos": [
            "No menu administrativo, acesse Turmas.",
            "Selecione o botão Adicionar nova oficina.",
            "O sistema abrirá o modal de criação da oficina."
          ]
        },
        {
          "titulo": "Informar dados da turma",
          "textos": [
            "Preencha o nome da turma.",
            "Selecione o professor responsável.",
            "Informe data de início, data de fim, capacidade máxima e descrição.",
            "Quando aplicável, selecione um modelo de certificado."
          ],
          "alerta": "O nome, o professor, as datas e a capacidade são informações importantes para salvar a turma corretamente."
        },
        {
          "titulo": "Montar a grade horária",
          "textos": [
            "Na seção de turnos, escolha o dia da semana.",
            "Informe horário de início e horário de fim.",
            "Selecione Incluir para adicionar o turno à grade.",
            "Repita o processo para cada dia de aula.",
            "Selecione Salvar para concluir."
          ],
          "itens": [
            "Use o botão de remover turno se algum horário foi incluído por engano.",
            "Revise a grade antes de salvar."
          ]
        }
      ]
    }
  },
  {
    "titulo": "Gerenciar matrículas em turma",
    "descricao": "Passo a passo para adicionar e remover alunos de uma turma.",
    "arquivo": "/assets/manuais/gerenciar_matriculas_turma.pdf",
    "nomeArquivo": "gerenciar_matriculas_turma.pdf",
    "cardIds": [
      "secretaria",
      "administrador"
    ],
    "roles": [
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a gerenciar os alunos matriculados em uma turma.",
        "Use esta funcionalidade para adicionar alunos, remover matrículas ou registrar encerramentos."
      ],
      "secoes": [
        {
          "titulo": "Abrir o quadro da turma",
          "textos": [
            "No menu administrativo, acesse Turmas.",
            "Abra o perfil ou quadro da turma desejada.",
            "O sistema exibirá as abas Adicionar Alunos e Remover Alunos."
          ]
        },
        {
          "titulo": "Adicionar alunos",
          "textos": [
            "Na aba Adicionar Alunos, use o campo Buscar aluno para adicionar.",
            "Selecione os alunos desejados na lista de resultados.",
            "Depois, selecione Salvar aluno selecionado ou Salvar alunos selecionados."
          ],
          "alerta": "A turma precisa aceitar matrícula para que a aba de adição fique disponível."
        },
        {
          "titulo": "Remover ou encerrar participação",
          "textos": [
            "Na aba Remover Alunos, localize o aluno matriculado.",
            "Selecione a ação de remoção da matrícula.",
            "No modal de encerramento, informe o tipo de encerramento, motivo, observação e data.",
            "Confirme para registrar o encerramento."
          ],
          "itens": [
            "Use a exportação CSV quando precisar da lista de alunos da turma.",
            "Confira a data de encerramento antes de confirmar."
          ]
        }
      ]
    }
  },
  {
    "titulo": "Realizar chamada",
    "descricao": "Passo a passo para registrar presença dos alunos.",
    "arquivo": "/assets/manuais/realizar_chamada.pdf",
    "nomeArquivo": "realizar_chamada.pdf",
    "cardIds": [
      "professor",
      "secretaria",
      "administrador"
    ],
    "roles": [
      "PROFESSOR",
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a realizar a chamada diária de uma turma.",
        "Use esta funcionalidade para registrar presença, falta e faltas justificadas."
      ],
      "secoes": [
        {
          "titulo": "Carregar a chamada",
          "textos": [
            "No menu administrativo, acesse Frequências.",
            "Na aba Fazer Chamada, selecione a turma.",
            "Informe a data da aula.",
            "Selecione Carregar Chamada."
          ],
          "alerta": "A chamada só pode ser editada no próprio dia da aula. Datas anteriores aparecem em modo somente leitura."
        },
        {
          "titulo": "Registrar presenças",
          "textos": [
            "Confira a lista de alunos carregada.",
            "Use Marcar todos presentes para registrar presença para toda a turma.",
            "Use Marcar todos ausentes para registrar falta para toda a turma.",
            "Em cada aluno, selecione o botão Presente ou Falta para alternar o status individual."
          ],
          "itens": [
            "Faltas justificadas por atestado aparecem identificadas e não devem ser alteradas manualmente.",
            "Confira os totais de presentes, faltas e justificadas antes de salvar."
          ]
        },
        {
          "titulo": "Salvar chamada",
          "textos": [
            "Depois de revisar os registros, selecione Salvar Chamada.",
            "Aguarde a confirmação do sistema antes de sair da tela."
          ],
          "alerta": "A chamada em lote é salva como uma operação única. Se houver falha, os registros podem não ser gravados."
        }
      ]
    }
  },
  {
    "titulo": "Consultar histórico de frequência",
    "descricao": "Passo a passo para consultar chamadas já registradas.",
    "arquivo": "/assets/manuais/consultar_historico_frequencia.pdf",
    "nomeArquivo": "consultar_historico_frequencia.pdf",
    "cardIds": [
      "professor",
      "secretaria",
      "administrador"
    ],
    "roles": [
      "PROFESSOR",
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a consultar o histórico de frequência de uma turma.",
        "Use esta funcionalidade para verificar chamadas anteriores e detalhes por aluno."
      ],
      "secoes": [
        {
          "titulo": "Abrir o histórico",
          "textos": [
            "No menu administrativo, acesse Frequências.",
            "Selecione a aba Histórico.",
            "Localize a turma e a chamada desejada."
          ]
        },
        {
          "titulo": "Ver detalhes da chamada",
          "textos": [
            "Abra os detalhes da chamada selecionada.",
            "O sistema exibirá um modal com a data da chamada.",
            "Confira os totais de presentes e faltas.",
            "Leia a lista nominal dos alunos com o status Presente ou Falta."
          ]
        },
        {
          "titulo": "Fechar a consulta",
          "textos": [
            "Após conferir as informações, selecione Sair ou Fechar janela de detalhes.",
            "Você retornará para a tela de histórico."
          ],
          "alerta": "O histórico é uma consulta. Alterações em chamadas antigas não ficam disponíveis nessa tela."
        }
      ]
    }
  },
  {
    "titulo": "Criar modelo de certificado",
    "descricao": "Passo a passo para criar um modelo de certificado ou honraria.",
    "arquivo": "/assets/manuais/criar_modelo_certificado.pdf",
    "nomeArquivo": "criar_modelo_certificado.pdf",
    "cardIds": [
      "secretaria",
      "administrador"
    ],
    "roles": [
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a criar modelos usados na emissão de certificados e honrarias.",
        "Use esta funcionalidade antes de gerar certificados acadêmicos ou honrarias manuais."
      ],
      "secoes": [
        {
          "titulo": "Iniciar novo modelo",
          "textos": [
            "No menu administrativo, acesse Modelos de Certificados.",
            "Selecione Novo Modelo.",
            "O sistema abrirá a tela Novo Modelo de Certificado."
          ]
        },
        {
          "titulo": "Informar dados do modelo",
          "textos": [
            "Preencha o Nome do Template.",
            "Selecione a Categoria.",
            "Use Acadêmico para certificados de turmas.",
            "Use Amigos do Braille para honrarias gerais."
          ],
          "alerta": "Modelos acadêmicos aceitam dados de turma. Modelos de honraria são usados para agradecimentos a apoiadores."
        },
        {
          "titulo": "Configurar arte e assinatura",
          "textos": [
            "Envie a Arte de Fundo em JPG ou PNG.",
            "Envie a assinatura em PNG transparente.",
            "Informe o nome e o cargo do signatário.",
            "Se necessário, configure uma segunda assinatura.",
            "Revise a prévia e salve o modelo."
          ],
          "itens": [
            "A arte de fundo é obrigatória ao criar um modelo novo.",
            "A assinatura principal é obrigatória ao criar um modelo novo."
          ]
        }
      ]
    }
  },
  {
    "titulo": "Emitir certificado acadêmico",
    "descricao": "Passo a passo para gerar certificado acadêmico manual.",
    "arquivo": "/assets/manuais/emitir_certificado_academico.pdf",
    "nomeArquivo": "emitir_certificado_academico.pdf",
    "cardIds": [
      "secretaria",
      "administrador"
    ],
    "roles": [
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a emitir um certificado acadêmico para um aluno cadastrado.",
        "Use esta funcionalidade quando for necessário gerar um certificado manual vinculado a aluno e turma."
      ],
      "secoes": [
        {
          "titulo": "Escolher o modelo",
          "textos": [
            "No menu administrativo, acesse Modelos de Certificados.",
            "Localize um modelo com a categoria Acadêmico.",
            "Selecione o botão Gerar Manual."
          ]
        },
        {
          "titulo": "Informar aluno e turma",
          "textos": [
            "No modal Gerar certificado manual, busque o aluno cadastrado.",
            "Selecione o aluno na lista de resultados.",
            "Selecione a turma relacionada ao certificado.",
            "Informe a data de emissão."
          ],
          "alerta": "O certificado acadêmico manual exige aluno, turma e data de emissão."
        },
        {
          "titulo": "Gerar certificado",
          "textos": [
            "Revise os dados informados.",
            "Selecione Gerar certificado.",
            "Aguarde o processamento.",
            "O certificado gerado ficará vinculado ao aluno e à turma."
          ]
        }
      ]
    }
  },
  {
    "titulo": "Emitir honraria para apoiador",
    "descricao": "Passo a passo para gerar uma honraria manual para apoiador.",
    "arquivo": "/assets/manuais/emitir_honraria_apoiador.pdf",
    "nomeArquivo": "emitir_honraria_apoiador.pdf",
    "cardIds": [
      "comunicacao",
      "administrador"
    ],
    "roles": [
      "COMUNICACAO",
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a emitir uma honraria para um apoiador cadastrado.",
        "Use esta funcionalidade para registrar certificados de reconhecimento e agradecimento."
      ],
      "secoes": [
        {
          "titulo": "Escolher modelo de honraria",
          "textos": [
            "No menu administrativo, acesse Modelos de Certificados.",
            "Localize um modelo com a categoria Honraria.",
            "Selecione Gerar Manual."
          ]
        },
        {
          "titulo": "Preencher dados da honraria",
          "textos": [
            "No modal Gerar honraria manual, busque o apoiador cadastrado.",
            "Selecione o apoiador na lista de resultados.",
            "Informe o título da ação.",
            "Descreva o motivo da honraria, quando necessário.",
            "Informe a data do evento."
          ],
          "alerta": "Apoiador, título da ação e data do evento são necessários para gerar a honraria."
        },
        {
          "titulo": "Gerar e consultar",
          "textos": [
            "Selecione Gerar certificado.",
            "Depois da emissão, acesse Apoiadores.",
            "Na linha do apoiador, abra Certificados e honrarias para visualizar ou baixar o PDF."
          ]
        }
      ]
    }
  },
  {
    "titulo": "Cadastrar apoiador",
    "descricao": "Passo a passo para registrar um apoiador no sistema.",
    "arquivo": "/assets/manuais/cadastrar_apoiador.pdf",
    "nomeArquivo": "cadastrar_apoiador.pdf",
    "cardIds": [
      "comunicacao",
      "secretaria",
      "administrador"
    ],
    "roles": [
      "COMUNICACAO"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a cadastrar um apoiador ou parceiro.",
        "Use esta funcionalidade para registrar dados institucionais, contato, endereço, logo e ações do apoiador."
      ],
      "secoes": [
        {
          "titulo": "Abrir cadastro",
          "textos": [
            "No menu administrativo, acesse Apoiadores.",
            "Selecione Novo Apoiador.",
            "O sistema abrirá um formulário em etapas."
          ]
        },
        {
          "titulo": "Preencher informações",
          "textos": [
            "Informe o tipo de apoiador, CPF ou CNPJ, nome ou razão social e nome fantasia.",
            "Preencha e-mail, telefone, pessoa de contato e atividade ou especialidade.",
            "Informe o endereço do apoiador.",
            "Se houver, envie a logo e marque Exibir no site."
          ],
          "alerta": "Os campos obrigatórios da etapa atual precisam estar válidos para avançar."
        },
        {
          "titulo": "Registrar ações e salvar",
          "textos": [
            "Na etapa de ações, adicione data do evento e descrição da ação realizada.",
            "Use o botão de adicionar para incluir mais ações.",
            "Revise as informações e selecione Salvar Apoiador."
          ],
          "itens": [
            "Use Observações para registrar histórico interno.",
            "Remova uma ação se ela foi inserida por engano."
          ]
        }
      ]
    }
  },
  {
    "titulo": "Alterar informações do site",
    "descricao": "Passo a passo para atualizar conteúdo institucional do site.",
    "arquivo": "/assets/manuais/alterar_informacoes_site.pdf",
    "nomeArquivo": "alterar_informacoes_site.pdf",
    "cardIds": [
      "comunicacao",
      "administrador"
    ],
    "roles": [
      "COMUNICACAO"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a alterar informações exibidas no site institucional.",
        "Use esta funcionalidade para atualizar configurações, textos, seções públicas e dados de contato."
      ],
      "secoes": [
        {
          "titulo": "Acessar conteúdo do site",
          "textos": [
            "No menu administrativo, acesse Conteúdo do Site.",
            "Use as abas para escolher a seção que deseja alterar.",
            "As abas disponíveis incluem Configurações, Hero, Missão, Oficinas, Depoimentos, FAQ, Sobre, Notícias e Contato."
          ]
        },
        {
          "titulo": "Editar uma seção",
          "textos": [
            "Selecione a aba da seção desejada.",
            "Atualize os campos apresentados na tela.",
            "Quando houver editor de texto, escreva o conteúdo institucional de forma clara.",
            "Revise imagens, links e informações de contato antes de salvar."
          ]
        },
        {
          "titulo": "Salvar alterações",
          "textos": [
            "Selecione o botão de salvar da seção alterada.",
            "Aguarde a confirmação do sistema.",
            "Depois, consulte o site público para conferir a atualização."
          ],
          "alerta": "As alterações podem afetar o conteúdo visível ao público. Revise antes de salvar."
        }
      ]
    }
  },
  {
    "titulo": "Publicar comunicado ou notícia",
    "descricao": "Passo a passo para publicar notícia ou comunicado no site.",
    "arquivo": "/assets/manuais/publicar_comunicado_noticia.pdf",
    "nomeArquivo": "publicar_comunicado_noticia.pdf",
    "cardIds": [
      "comunicacao",
      "administrador"
    ],
    "roles": [
      "COMUNICACAO"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a cadastrar e publicar notícias na área pública do site.",
        "Use esta funcionalidade para divulgar comunicados, eventos e informações institucionais."
      ],
      "secoes": [
        {
          "titulo": "Acessar notícias",
          "textos": [
            "No menu administrativo, acesse Conteúdo do Site.",
            "Selecione a aba Notícias.",
            "O sistema exibirá a lista de comunicados cadastrados."
          ]
        },
        {
          "titulo": "Criar ou editar comunicado",
          "textos": [
            "Selecione a ação de novo comunicado ou edição de um comunicado existente.",
            "Preencha título, conteúdo e demais campos apresentados.",
            "Quando houver campo de imagem, selecione uma imagem adequada para publicação.",
            "Revise o texto antes de publicar."
          ],
          "itens": [
            "Use títulos curtos e objetivos.",
            "Escreva o conteúdo em linguagem clara para o público externo."
          ]
        },
        {
          "titulo": "Publicar",
          "textos": [
            "Salve o comunicado.",
            "Quando o comunicado estiver publicado, ele poderá aparecer na rota pública Notícias.",
            "Use a edição para corrigir informações quando necessário."
          ],
          "alerta": "Não publique dados pessoais ou informações internas sem autorização."
        }
      ]
    }
  },
  {
    "titulo": "Cadastrar usuário",
    "descricao": "Passo a passo para cadastrar usuário do sistema.",
    "arquivo": "/assets/manuais/cadastrar_usuario.pdf",
    "nomeArquivo": "cadastrar_usuario.pdf",
    "cardIds": [
      "administrador"
    ],
    "roles": [
      "ADMIN"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a cadastrar um novo usuário administrativo.",
        "Use esta funcionalidade para conceder acesso ao sistema conforme a função da pessoa."
      ],
      "secoes": [
        {
          "titulo": "Iniciar cadastro",
          "textos": [
            "No menu administrativo, acesse Usuários.",
            "Selecione Novo Usuário.",
            "O sistema abrirá o formulário de cadastro em etapas."
          ]
        },
        {
          "titulo": "Preencher dados",
          "textos": [
            "Informe nome completo e CPF.",
            "Selecione a função do usuário.",
            "Preencha e-mail, telefone e endereço.",
            "Use Avançar para passar para a próxima etapa."
          ],
          "alerta": "O CPF é verificado pelo sistema. Se já existir usuário inativo, o sistema poderá oferecer reativação."
        },
        {
          "titulo": "Finalizar cadastro",
          "textos": [
            "Revise todos os dados informados.",
            "Selecione Cadastrar Usuário.",
            "Depois do cadastro, use Ir para a Lista de Usuários para voltar ao gerenciamento."
          ]
        }
      ]
    }
  },
  {
    "titulo": "Gerenciar usuários",
    "descricao": "Passo a passo para consultar e administrar usuários do sistema.",
    "arquivo": "/assets/manuais/gerenciar_usuarios.pdf",
    "nomeArquivo": "gerenciar_usuarios.pdf",
    "cardIds": [
      "administrador"
    ],
    "roles": [
      "ADMIN"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a consultar, editar, inativar e restaurar usuários.",
        "Use esta funcionalidade para manter acessos e permissões atualizados."
      ],
      "secoes": [
        {
          "titulo": "Consultar usuários",
          "textos": [
            "No menu administrativo, acesse Usuários.",
            "Use o campo Buscar usuário por nome para localizar uma pessoa.",
            "Use as abas Ativos e Inativos para alternar entre usuários ativos e inativados."
          ]
        },
        {
          "titulo": "Ver e editar perfil",
          "textos": [
            "Na linha do usuário, selecione Ver para abrir o perfil.",
            "Selecione Editar para alterar os dados do usuário.",
            "Salve as alterações no modal de edição."
          ]
        },
        {
          "titulo": "Inativar ou restaurar acesso",
          "textos": [
            "Na aba Ativos, selecione Excluir para inativar o usuário.",
            "Na aba Inativos, selecione Restaurar para devolver o acesso.",
            "Também é possível excluir permanentemente um usuário inativo."
          ],
          "alerta": "A exclusão permanente deve ser usada com cuidado, pois remove o registro de forma definitiva."
        }
      ]
    }
  },
  {
    "titulo": "Criar atendimento individual",
    "descricao": "Passo a passo para criar acompanhamento individual de aluno.",
    "arquivo": "/assets/manuais/criar_atendimento_individual.pdf",
    "nomeArquivo": "criar_atendimento_individual.pdf",
    "cardIds": [
      "professor",
      "secretaria",
      "administrador"
    ],
    "roles": [
      "PROFESSOR",
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a criar um acompanhamento individual para um aluno.",
        "Use esta funcionalidade para iniciar o acompanhamento antes de registrar atendimentos."
      ],
      "secoes": [
        {
          "titulo": "Abrir novo acompanhamento",
          "textos": [
            "No menu administrativo, acesse Atendimentos Individuais.",
            "Selecione a opção para criar um novo acompanhamento.",
            "O sistema abrirá o modal Novo acompanhamento individual."
          ]
        },
        {
          "titulo": "Selecionar aluno e responsável",
          "textos": [
            "Busque o aluno no campo de seleção.",
            "Selecione o aluno correto na lista.",
            "Se você for administrador ou secretaria, selecione o professor responsável.",
            "Se você for professor, o acompanhamento será vinculado ao seu usuário."
          ]
        },
        {
          "titulo": "Informar assunto e criar",
          "textos": [
            "Informe o assunto principal do acompanhamento.",
            "Preencha a descrição inicial com contexto relevante.",
            "Revise os dados na etapa de confirmação.",
            "Selecione Criar acompanhamento."
          ],
          "alerta": "Se o sistema indicar possível duplicidade, revise antes de escolher Criar mesmo assim."
        }
      ]
    }
  },
  {
    "titulo": "Registrar atendimento individual",
    "descricao": "Passo a passo para adicionar registro em um acompanhamento individual.",
    "arquivo": "/assets/manuais/registrar_atendimento_individual.pdf",
    "nomeArquivo": "registrar_atendimento_individual.pdf",
    "cardIds": [
      "professor",
      "secretaria",
      "administrador"
    ],
    "roles": [
      "PROFESSOR",
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a registrar um atendimento dentro de um acompanhamento individual.",
        "Use esta funcionalidade para documentar atendimento realizado, falta justificada, falta não justificada ou cancelamento."
      ],
      "secoes": [
        {
          "titulo": "Abrir acompanhamento",
          "textos": [
            "No menu administrativo, acesse Atendimentos Individuais.",
            "Abra a lista de acompanhamentos em andamento.",
            "Selecione o acompanhamento desejado.",
            "Selecione Novo atendimento."
          ]
        },
        {
          "titulo": "Preencher registro",
          "textos": [
            "Selecione o tipo de registro.",
            "Informe a data do atendimento.",
            "Quando necessário, informe horário de início, horário de fim, duração, modalidade e local.",
            "Para atendimento realizado, preencha assunto do dia, observação, evolução, dificuldades, pendências e recomendações.",
            "Para falta justificada, informe o motivo."
          ],
          "alerta": "Os campos exibidos mudam conforme o tipo de registro selecionado."
        },
        {
          "titulo": "Salvar e anexar arquivos",
          "textos": [
            "Revise as informações na etapa de confirmação.",
            "Selecione Salvar atendimento.",
            "Depois de salvar, anexe documentos ou materiais relacionados quando necessário.",
            "Finalize para retornar ao acompanhamento."
          ]
        }
      ]
    }
  },
  {
    "titulo": "Gerar relatório de atendimento individual",
    "descricao": "Passo a passo para consultar e imprimir relatório de atendimentos individuais.",
    "arquivo": "/assets/manuais/gerar_relatorio_atendimento_individual.pdf",
    "nomeArquivo": "gerar_relatorio_atendimento_individual.pdf",
    "cardIds": [
      "professor",
      "secretaria",
      "administrador"
    ],
    "roles": [
      "PROFESSOR",
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a gerar relatório dos atendimentos individuais.",
        "Use esta funcionalidade para consultar acompanhamentos por aluno, professor, período, status e tipo de registro."
      ],
      "secoes": [
        {
          "titulo": "Acessar relatório",
          "textos": [
            "No menu administrativo, acesse Atendimentos Individuais.",
            "Selecione a área de relatório.",
            "O sistema exibirá filtros e resumo dos registros."
          ]
        },
        {
          "titulo": "Aplicar filtros",
          "textos": [
            "Filtre por aluno, professor, período, status ou tipo de registro.",
            "Aguarde a atualização dos resultados.",
            "Confira o resumo apresentado na tela."
          ]
        },
        {
          "titulo": "Imprimir relatório",
          "textos": [
            "Depois de revisar os dados, selecione o botão de impressão.",
            "Na janela de impressão do navegador, escolha imprimir ou salvar como PDF."
          ],
          "alerta": "A exportação em PDF pelo backend é um ponto futuro. O fluxo atual usa impressão da tela."
        }
      ]
    }
  },
  {
    "titulo": "Relatórios institucionais",
    "descricao": "Passo a passo para consultar relatórios administrativos do sistema.",
    "arquivo": "/assets/manuais/relatorios_institucionais.pdf",
    "nomeArquivo": "relatorios_institucionais.pdf",
    "cardIds": [
      "secretaria",
      "comunicacao",
      "administrador"
    ],
    "roles": [
      "SECRETARIA",
      "COMUNICACAO"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a consultar relatórios institucionais.",
        "Use esta funcionalidade para acompanhar indicadores de alunos, turmas, evasões, atendimentos e impacto social."
      ],
      "secoes": [
        {
          "titulo": "Acessar relatórios",
          "textos": [
            "No menu administrativo, acesse Relatórios.",
            "Escolha a aba que deseja consultar.",
            "As abas incluem Alunos, Turmas, Evasões, Atendimentos, Impacto Social e Exportações."
          ]
        },
        {
          "titulo": "Filtrar informações",
          "textos": [
            "Abra os filtros avançados quando precisar refinar a consulta.",
            "Informe período, turma, aluno, cidade, bairro ou outros campos disponíveis.",
            "Aplique os filtros para atualizar os dados da aba aberta."
          ],
          "alerta": "O sistema carrega cada aba sob demanda. Uma aba só busca dados depois que é aberta."
        },
        {
          "titulo": "Exportar dados",
          "textos": [
            "Abra a aba Exportações.",
            "Use a opção de PDF para relatório público ou institucional.",
            "Use a opção XLSX para relatório interno detalhado."
          ],
          "itens": [
            "Revise os filtros antes de exportar.",
            "Arquivos internos podem conter dados sensíveis."
          ]
        }
      ]
    }
  },
  {
    "titulo": "Evasões e risco de evasão",
    "descricao": "Passo a passo para consultar evasões e registrar ações de risco.",
    "arquivo": "/assets/manuais/evasoes_e_risco_evasao.pdf",
    "nomeArquivo": "evasoes_e_risco_evasao.pdf",
    "cardIds": [
      "secretaria",
      "administrador"
    ],
    "roles": [
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a acompanhar evasões e alunos com risco de evasão.",
        "Use esta funcionalidade para consultar indicadores e registrar ações de intervenção."
      ],
      "secoes": [
        {
          "titulo": "Abrir aba de evasões",
          "textos": [
            "No menu administrativo, acesse Relatórios.",
            "Selecione a aba Evasões.",
            "O sistema carregará histórico de encerramentos e risco de evasão."
          ]
        },
        {
          "titulo": "Consultar risco",
          "textos": [
            "Analise os cards e listas exibidos na aba.",
            "Confira alunos sinalizados com risco.",
            "Use os filtros para restringir o período ou o público consultado."
          ]
        },
        {
          "titulo": "Criar ou resolver ação",
          "textos": [
            "Quando não houver ação aberta, selecione Criar ação.",
            "Preencha os dados da intervenção.",
            "Quando já existir ação, use Ver ação ou Resolver.",
            "Ao resolver, informe o resultado da intervenção."
          ],
          "alerta": "O cálculo de risco vem do backend. Não altere manualmente os critérios do relatório."
        }
      ]
    }
  },
  {
    "titulo": "PDI do aluno",
    "descricao": "Passo a passo para criar e acompanhar o Plano de Desenvolvimento Individual do aluno.",
    "arquivo": "/assets/manuais/pdi_aluno.pdf",
    "nomeArquivo": "pdi_aluno.pdf",
    "cardIds": [
      "professor",
      "secretaria",
      "administrador"
    ],
    "roles": [
      "PROFESSOR",
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a criar e acompanhar o PDI de um aluno.",
        "Use esta funcionalidade no perfil do aluno para registrar metas, evoluções e conclusão do plano."
      ],
      "secoes": [
        {
          "titulo": "Abrir PDI no perfil",
          "textos": [
            "No menu administrativo, acesse Alunos.",
            "Localize o aluno desejado.",
            "Selecione Ver para abrir o perfil.",
            "Na seção PDI, confira se já existe um PDI ativo."
          ]
        },
        {
          "titulo": "Criar PDI",
          "textos": [
            "Quando não houver PDI ativo, selecione Criar PDI.",
            "Preencha os dados do plano, objetivo geral, período previsto e professor responsável quando solicitado.",
            "Salve para registrar o PDI."
          ],
          "alerta": "O aluno deve ter apenas um PDI ativo por vez."
        },
        {
          "titulo": "Acompanhar metas e evoluções",
          "textos": [
            "Com PDI ativo, selecione Adicionar meta para registrar uma nova meta.",
            "Selecione Adicionar evolução para registrar o acompanhamento.",
            "Atualize o status das metas na tabela.",
            "Quando o plano terminar, selecione Concluir PDI."
          ],
          "itens": [
            "O histórico de PDIs anteriores fica preservado.",
            "As evoluções ficam organizadas em uma tabela histórica."
          ]
        }
      ]
    }
  },
  {
    "titulo": "Linha do tempo do aluno",
    "descricao": "Passo a passo para consultar a linha do tempo institucional do aluno.",
    "arquivo": "/assets/manuais/linha_tempo_aluno.pdf",
    "nomeArquivo": "linha_tempo_aluno.pdf",
    "cardIds": [
      "professor",
      "secretaria",
      "administrador"
    ],
    "roles": [
      "PROFESSOR",
      "SECRETARIA"
    ],
    "conteudo": {
      "introducao": [
        "Aprenda a consultar a linha do tempo completa do aluno.",
        "Use esta funcionalidade para ver histórico de cadastro, matrículas, frequências, atendimentos, PDI, documentos, certificados e risco de evasão."
      ],
      "secoes": [
        {
          "titulo": "Abrir linha do tempo",
          "textos": [
            "No menu administrativo, acesse Alunos.",
            "Localize o aluno desejado.",
            "Selecione Ver para abrir o perfil.",
            "Na seção Linha do Tempo, selecione Abrir linha do tempo completa."
          ]
        },
        {
          "titulo": "Consultar eventos",
          "textos": [
            "A tela exibirá o resumo do aluno.",
            "Confira os cards de último atendimento, última frequência, PDI e risco quando existirem.",
            "Leia a lista de eventos em ordem cronológica.",
            "Use os filtros por categoria para restringir os tipos de evento."
          ]
        },
        {
          "titulo": "Adicionar observação manual",
          "textos": [
            "Na tela completa, selecione Adicionar observação.",
            "Escolha o tipo de observação disponível.",
            "Preencha a descrição e salve o registro."
          ],
          "alerta": "A linha do tempo contém dados sensíveis do aluno. Use as informações apenas para finalidade institucional."
        }
      ]
    }
  }
];

export const TECNOLOGIAS_SISTEMA: TecnologiaItem[] = [
  { nome: 'Angular 19', icon: 'code', descricao: 'Frontend' },
  { nome: 'NestJS', icon: 'api', descricao: 'Backend API' },
  { nome: 'PostgreSQL + Neon', icon: 'database', descricao: 'Banco de Dados' },
  { nome: 'Cloudinary', icon: 'cloud', descricao: 'Armazenamento de Arquivos' },
  { nome: 'Vercel', icon: '▲', descricao: 'Hospedagem Frontend' },
  { nome: 'Render.com', icon: 'language', descricao: 'Hospedagem Backend' },
];

export const EQUIPE_SISTEMA: EquipeItem[] = [
  { nome: 'Alexsander Ribeiro', papel: 'Dev', github: 'https://github.com/Sander0026' },
  { nome: 'Nickolas Blendes', papel: 'Dev', github: 'https://github.com/NycollasBlenes-max' },
  { nome: 'Victor Severiano', papel: 'Dev', github: 'https://github.com/VictorSeveriano' },
];
