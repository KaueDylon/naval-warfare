/**
 * Nomes reais de navios por nação e classe, com breve contexto histórico.
 * Chave: NATION → SHIP_TYPE (uppercase) → { name, history }
 */
export const SHIP_NAMES = {
  USA: {
    CARRIER: {
      name: "USS Yorktown",
      history:
        "O USS Yorktown (CV-5) foi um porta-aviões classe Yorktown que combateu na Batalha de Midway em 1942. Mesmo danificado na Batalha do Mar de Coral, foi reparado em apenas 72 horas e participou da batalha decisiva do Pacífico, onde ajudou a afundar quatro porta-aviões japoneses antes de ser torpedado pelo submarino I-168.",
    },
    BATTLESHIP: {
      name: "USS Iowa",
      history:
        "O USS Iowa (BB-61) foi o navio líder da última classe de encouraçados construídos pela Marinha dos EUA. Com 270 metros de comprimento e nove canhões de 406mm, escoltou comboios no Atlântico e bombardeou posições japonesas no Pacífico. Transportou o presidente Roosevelt à Conferência de Teerã em 1943.",
    },
    CRUISER: {
      name: "USS Indianapolis",
      history:
        "O USS Indianapolis (CA-35) transportou secretamente componentes da bomba atômica Little Boy para Tinian em julho de 1945. Na volta, foi torpedado pelo submarino japonês I-58. Dos 1.195 tripulantes, apenas 316 sobreviveram após 4 dias no mar, muitos vítimas de tubarões — a maior perda em um único navio da história da Marinha dos EUA.",
    },
    DESTROYER: {
      name: "USS Laffey",
      history:
        "O USS Laffey (DD-724) ficou conhecido como 'O Navio Que Não Morreria'. Em abril de 1945, durante a Batalha de Okinawa, sobreviveu a 22 ataques kamikaze e bombardeios em 80 minutos. Atingido por 6 kamikazes e 4 bombas, recusou-se a afundar e foi salvo pela tripulação.",
    },
    SUBMARINE: {
      name: "USS Wahoo",
      history:
        "O USS Wahoo (SS-238) foi o submarino americano mais agressivo do Pacífico sob o comando do lendário Comandante Dudley 'Mush' Morton. Em apenas 5 patrulhas, afundou 20 navios japoneses. Perdido em outubro de 1943 no Estreito de La Pérouse, possivelmente por minas japonesas.",
    },
  },
  USSR: {
    CARRIER: {
      name: "Projeto 72",
      history:
        "O Projeto 72 foi o programa soviético para construção de porta-aviões pesados durante e após a Segunda Guerra. Nunca concluído devido às prioridades do esforço de guerra terrestre, o projeto representava a ambição da Marinha Soviética de competir com as frotas ocidentais no pós-guerra.",
    },
    BATTLESHIP: {
      name: "Marat",
      history:
        "O Marat (ex-Petropavlovsk) foi um encouraçado classe Gangut que defendeu Leningrado durante o cerco de 900 dias. Em setembro de 1941, foi atingido por uma bomba de 1000kg lançada por Hans-Ulrich Rudel, que destruiu sua proa. Mesmo afundado em águas rasas, continuou usando seus canhões como bateria costeira até o fim da guerra.",
    },
    CRUISER: {
      name: "Kirov",
      history:
        "O Kirov foi o cruzador líder de sua classe e o navio mais poderoso da Frota do Báltico soviética. Durante o cerco de Leningrado, seus canhões de 180mm forneceram apoio de fogo crucial contra as forças alemãs. Sobreviveu a múltiplos ataques aéreos e minas, servindo até os anos 1970.",
    },
    DESTROYER: {
      name: "Gremyashchy",
      history:
        "O Gremyashchy ('Trovejante') foi um destroyer classe Gnevny que serviu na Frota do Norte. Escoltou comboios aliados no Ártico, incluindo os perigosos comboios PQ para Murmansk. Em 1943, foi danificado por uma mina magnética alemã, mas sobreviveu e retornou ao serviço.",
    },
    SUBMARINE: {
      name: "S-13",
      history:
        "O S-13, comandado por Alexander Marinesko, realizou o ataque submarino mais devastador da história ao torpedear o MV Wilhelm Gustloff em janeiro de 1945, causando a morte de mais de 9.000 pessoas — a maior catástrofe marítima de todos os tempos, superando o Titanic em seis vezes.",
    },
  },
  ITALY: {
    CARRIER: {
      name: "Aquila",
      history:
        "O Aquila foi a tentativa italiana de converter o transatlântico Roma em porta-aviões. Quase concluído em 1943, nunca entrou em serviço ativo devido ao armistício italiano. Foi sabotado pelos alemães e depois afundado por torpedos humanos italianos para bloquear o porto de Gênova.",
    },
    BATTLESHIP: {
      name: "Roma",
      history:
        "O Roma foi o terceiro encouraçado classe Littorio e o mais moderno da Regia Marina. Em 9 de setembro de 1943, ao navegar para se render aos Aliados após o armistício, foi atingido por duas bombas guiadas Fritz X alemãs. Afundou em minutos, levando 1.393 tripulantes, incluindo o Almirante Bergamini.",
    },
    CRUISER: {
      name: "Zara",
      history:
        "O Zara foi um cruzador pesado italiano que participou da Batalha do Cabo Matapan em março de 1941. Sem radar e surpreendido à noite pela esquadra britânica do Almirante Cunningham, foi devastado a curta distância pelos encouraçados HMS Warspite, Valiant e Barham. Afundou com 783 tripulantes.",
    },
    DESTROYER: {
      name: "Alpino",
      history:
        "O Alpino foi um destroyer classe Soldato da Regia Marina. Participou de escoltas de comboios no Mediterrâneo e engajamentos contra forças britânicas. Representava a classe de destroyers italianos que, apesar de limitações em radar e sonar, combateram intensamente nas rotas para o Norte da África.",
    },
    SUBMARINE: {
      name: "Scirè",
      history:
        "O Scirè foi o submarino italiano mais famoso da guerra, especializado em operações com torpedos humanos (maiali). Em dezembro de 1941, transportou os operadores que penetraram o porto de Alexandria e afundaram os encouraçados britânicos HMS Queen Elizabeth e HMS Valiant — uma das operações especiais mais audaciosas da guerra.",
    },
  },
  GERMANY: {
    CARRIER: {
      name: "Graf Zeppelin",
      history:
        "O Graf Zeppelin foi o único porta-aviões que a Alemanha tentou construir. Lançado em 1938 mas nunca concluído devido a disputas entre a Kriegsmarine e a Luftwaffe sobre o controle dos aviões embarcados. Foi afundado pelos alemães em 1945 para evitar captura soviética.",
    },
    BATTLESHIP: {
      name: "Bismarck",
      history:
        "O Bismarck foi o encouraçado mais temido da Kriegsmarine. Em sua primeira missão em maio de 1941, afundou o HMS Hood — orgulho da Royal Navy — com um único salvo. A Marinha Britânica mobilizou toda a Home Fleet para persegui-lo. Após ser imobilizado por um torpedo do Swordfish, foi destruído em 27 de maio de 1941.",
    },
    CRUISER: {
      name: "Prinz Eugen",
      history:
        "O Prinz Eugen foi um cruzador pesado classe Admiral Hipper que acompanhou o Bismarck na Batalha do Estreito da Dinamarca. Sobreviveu a toda a guerra, participando de operações no Atlântico e Báltico. Capturado pelos americanos em 1945, foi usado como alvo nos testes nucleares de Bikini em 1946.",
    },
    DESTROYER: {
      name: "Z1 Leberecht Maass",
      history:
        "O Z1 Leberecht Maass foi o primeiro destroyer construído para a Kriegsmarine após a Primeira Guerra. Participou da invasão da Noruega em 1940 e de operações no Mar do Norte. Foi afundado em fevereiro de 1940 por bombardeio acidental da Luftwaffe, que o confundiu com um navio britânico.",
    },
    SUBMARINE: {
      name: "U-513",
      history:
        "O U-513 foi um submarino alemão Tipo IXC que operou no Atlântico Sul. Em 1943, atacou navios ao largo da costa brasileira, incluindo navios brasileiros. Foi afundado em julho de 1943 por um avião da Marinha dos EUA próximo à costa de Santa Catarina. Seus destroços foram localizados em 2011 a 100 metros de profundidade.",
    },
  },
  JAPAN: {
    CARRIER: {
      name: "Akagi",
      history:
        "O Akagi ('Castelo Vermelho') foi o porta-aviões capitânia da Kidō Butai, a força de ataque que devastou Pearl Harbor em dezembro de 1941. Na Batalha de Midway em junho de 1942, foi atingido por bombardeiros de mergulho americanos e incendiou-se catastroficamente. Foi afundado por torpedos japoneses para evitar captura.",
    },
    BATTLESHIP: {
      name: "Yamato",
      history:
        "O Yamato foi o maior e mais pesado encouraçado já construído, com 72.000 toneladas e canhões de 460mm — os maiores já montados em um navio. Em abril de 1945, partiu em missão suicida rumo a Okinawa sem combustível para voltar. Foi afundado por mais de 300 aviões americanos, levando 3.055 dos 3.332 tripulantes.",
    },
    CRUISER: {
      name: "Chōkai",
      history:
        "O Chōkai foi um cruzador pesado classe Takao que serviu como capitânia na Batalha da Ilha de Savo em agosto de 1942 — a pior derrota naval americana desde Pearl Harbor, onde quatro cruzadores aliados foram afundados. Foi destruído na Batalha de Samar em outubro de 1944 ao enfrentar os porta-aviões de escolta americanos.",
    },
    DESTROYER: {
      name: "Yukikaze",
      history:
        "O Yukikaze ('Vento de Neve') foi o destroyer mais sortudo da Marinha Imperial Japonesa. Participou de praticamente todas as grandes batalhas do Pacífico — Midway, Guadalcanal, Leyte, e até a missão suicida do Yamato — e sobreviveu a todas sem danos graves. Um dos poucos navios japoneses a sobreviver à guerra intacto.",
    },
    SUBMARINE: {
      name: "I-400",
      history:
        "O I-400 foi o maior submarino construído antes da era nuclear, com 122 metros. Carregava três hidroaviões bombardeiros Aichi M6A Seiran em um hangar pressurizado, sendo efetivamente um porta-aviões submarino. Planejado para atacar o Canal do Panamá, rendeu-se antes de completar a missão.",
    },
  },
  UK: {
    CARRIER: {
      name: "HMS Ark Royal",
      history:
        "O HMS Ark Royal foi o porta-aviões mais famoso da Royal Navy na Segunda Guerra. Seus aviões Swordfish lançaram o torpedo que travou o leme do Bismarck, permitindo que a Home Fleet o alcançasse e destruísse. Em novembro de 1941, foi torpedado pelo U-81 no Mediterrâneo e afundou no dia seguinte.",
    },
    BATTLESHIP: {
      name: "HMS King George V",
      history:
        "O HMS King George V foi o encouraçado líder de sua classe e capitânia da Home Fleet. Participou da perseguição e destruição do Bismarck em maio de 1941, disparando mais de 300 projéteis de 356mm. Também serviu no Pacífico nos estágios finais da guerra contra o Japão.",
    },
    CRUISER: {
      name: "HMS Belfast",
      history:
        "O HMS Belfast é um cruzador leve classe Town que serviu no Ártico escoltando comboios para a Rússia e participou do afundamento do Scharnhorst em dezembro de 1943. No Dia D, bombardeou as praias da Normandia. Hoje é um navio-museu permanentemente ancorado no Tâmisa, em Londres.",
    },
    DESTROYER: {
      name: "HMS Cossack",
      history:
        "O HMS Cossack ficou famoso pelo Incidente do Altmark em 1940, quando abordou o navio-prisão alemão em águas norueguesas e libertou 299 prisioneiros britânicos. Também participou da perseguição ao Bismarck. Foi torpedado pelo U-563 em outubro de 1941 e afundou no Atlântico.",
    },
    SUBMARINE: {
      name: "HMS Upholder",
      history:
        "O HMS Upholder, comandado pelo Tenente-Comandante Malcolm Wanklyn (condecorado com a Victoria Cross), foi o submarino britânico mais bem-sucedido do Mediterrâneo. Em 16 meses de operação, afundou ou danificou mais de 130.000 toneladas de navios do Eixo. Foi perdido em abril de 1942 por cargas de profundidade.",
    },
  },
};

/**
 * Retorna o nome e história de um navio dado a nação e tipo.
 * @param {string} nation - Código da nação (ex: "USA", "UK", "GERMANY")
 * @param {string} shipType - Tipo do navio (ex: "CARRIER", "BATTLESHIP")
 * @returns {{ name: string, history: string } | null}
 */
export function getShipInfo(nation, shipType) {
  return SHIP_NAMES[nation]?.[shipType] ?? null;
}
