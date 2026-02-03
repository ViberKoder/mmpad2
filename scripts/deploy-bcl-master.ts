/**
 * Скрипт для развертывания BCL Master контракта с кастомными параметрами
 * 
 * Параметры:
 * - fullPriceTon: 300 TON (вместо 3 TON)
 * - feeAddress: UQDjQOdWTP1bPpGpYExAsCcVLGPN_pzGvdno3aCk565ZnQIz
 */

import { Address, beginCell, Cell, toNano, internal } from '@ton/core';
import { TonClient, WalletContractV4, JettonMaster } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';

// ========== КОНФИГУРАЦИЯ ==========
// Bytecode BCL master контракта в base64 (ваш bytecode)
// Если base64 не работает, используйте hex формат ниже
const BCL_MASTER_BYTECODE_BASE64 = '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';

// Адрес кошелька для комиссий
const FEE_ADDRESS = 'UQDjQOdWTP1bPpGpYExAsCcVLGPN_pzGvdno3aCk565ZnQIz';

// Параметры контракта
const FULL_PRICE_TON = 300; // 300 TON вместо 3 TON
const BCL_SUPPLY = 1000000000; // 1 миллиард токенов (1e9)
const LIQ_SUPPLY = 500000000; // 500 миллионов для ликвидности (0.5e9)
const TRADE_FEE_NUMERATOR = 5; // 5% комиссия
const TRADE_FEE_DENOMINATOR = 100; // 5/100 = 5%

// TON API endpoint
const TON_API_ENDPOINT = process.env.TON_API_ENDPOINT || 'https://toncenter.com/api/v2/jsonRPC';
// ==================================

/**
 * Создает начальные данные для BCL контракта
 * Структура данных согласно storage.fc
 */
function createInitialData(params: {
  admin: Address;
  authorAddress: Address;
  feeAddress: Address;
  maxTon: bigint;
  bclSupply: bigint;
  liqSupply: bigint;
  tradeFeeNumerator: number;
  tradeFeeDenominator: number;
  content: Cell;
  walletCode: Cell;
  routerAddress?: Address;
  routerPtonWalletAddress?: Address;
}): Cell {
  // Router info
  const routerInfo = beginCell()
    .storeAddress(params.routerAddress || Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'))
    .storeAddress(params.routerPtonWalletAddress || Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'))
    .endCell();

  // BCL данные (внутренний ref)
  // Создаем пустую ячейку для referral (должна содержать хотя бы один бит)
  const emptyReferral = beginCell().storeUint(0, 1).endCell();
  const bclData = beginCell()
    .storeCoins(params.bclSupply) // ctx_bcl_supply
    .storeCoins(params.liqSupply) // ctx_liq_supply
    .storeAddress(params.authorAddress) // ctx_author_address
    .storeAddress(params.feeAddress) // ctx_fee_address ⭐ ВАШ АДРЕС ДЛЯ КОМИССИЙ
    .storeUint(params.tradeFeeNumerator, 16) // ctx_trade_fee_numerator
    .storeUint(params.tradeFeeDenominator, 16) // ctx_trade_fee_denominator
    .storeUint(1, 1) // ctx_trading_enabled = 1
    .storeRef(emptyReferral) // ctx_referral (empty)
    .storeUint(0, 64) // ctx_seed
    .storeCoins(0) // ctx_trading_close_fee
    .storeRef(routerInfo)
    .endCell();

  // Основные данные
  // Проверяем, что content не пустой
  const contentCell = params.content.bits.length > 0 || params.content.refs.length > 0 
    ? params.content 
    : beginCell().storeUint(0, 1).endCell();
  
  const mainData = beginCell()
    .storeCoins(0) // ctx_total_supply (начально 0)
    .storeAddress(params.admin) // ctx_admin
    .storeRef(contentCell) // ctx_content
    .storeRef(params.walletCode) // ctx_wallet_code
    .storeUint(0, 32) // ctx_last_trade_date
    .storeCoins(0) // ctx_ton_liq_collected
    .storeCoins(params.maxTon) // ctx_max_ton ⭐ 300 TON
    .storeAddress(Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c')) // ctx_lp_receiver (address_none)
    .storeRef(bclData) // BCL данные
    .endCell();

  return mainData;
}

/**
 * Создает StateInit для развертывания контракта
 */
function createStateInit(code: Cell, data: Cell): { stateInit: Cell; address: Address } {
  const stateInit = beginCell()
    .storeBit(0) // split_depth
    .storeBit(0) // special
    .storeRef(code) // code
    .storeRef(data) // data
    .endCell();

  const hash = stateInit.hash();

  return { 
    stateInit, 
    address: new Address(0, hash)
  };
}

async function deploy() {
  console.log('🚀 Начинаем развертывание BCL Master контракта...\n');

  // Проверка мнемоников
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) {
    console.error('❌ Ошибка: Установите переменную окружения MNEMONIC');
    console.error('   Пример: export MNEMONIC="word1 word2 word3 ..."');
    console.error('   Или в PowerShell: $env:MNEMONIC="word1 word2 word3 ..."');
    process.exit(1);
  }

  // Инициализация клиента
  const client = new TonClient({
    endpoint: TON_API_ENDPOINT,
  });

  // Загрузка кошелька
  const key = await mnemonicToWalletKey(mnemonic.split(' '));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  const contract = client.open(wallet);

  console.log('📝 Адрес кошелька:', contract.address.toString({ urlSafe: true, bounceable: false }));

  // Получаем код jetton wallet из существующего master контракта
  console.log('📦 Получение кода jetton wallet из существующего контракта...');
  let walletCode: Cell;
  
  // Пробуем получить из кэша или существующего контракта с retry
  let retries = 3;
  while (retries > 0) {
    try {
      const existingMaster = Address.parse('EQBSMwczMFUb789uqNvebKBvemkRaAQJdzTFq6565Ef9rW2k');
      const masterState = await client.getContractState(existingMaster);
      
      if (!masterState.data) {
        throw new Error('Не удалось получить данные из существующего контракта');
      }
      
      // Парсим данные контракта согласно storage.fc
      const dataCell = Cell.fromBase64(masterState.data);
      const dataSlice = dataCell.beginParse();
      dataSlice.loadCoins(); // ctx_total_supply
      const adminAddr = dataSlice.loadMaybeAddress(); // ctx_admin (может быть address_none)
      walletCode = dataSlice.loadRef(); // ctx_wallet_code
      console.log('✅ Код jetton wallet получен');
      break;
    } catch (error: any) {
      if ((error.status === 429 || error.response?.status === 429) && retries > 1) {
        retries--;
        console.log(`⚠️ Rate limit при получении wallet code, ждем 30 секунд... (осталось попыток: ${retries})`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      } else {
        throw error;
      }
    }
  }
  
  let walletCodeRetries = 3;

  // Декодируем bytecode из base64
  // Используем hex формат, который вы предоставили ранее
  console.log('📦 Загрузка bytecode BCL master...');
  const hexCode = 'b5ee9c7201024d0100103d000114ff00f4a413f4bcf2c80b0102016202030202ca0405020120151602012006070047a920843c27e4635c0820063232c15401b3c594013e808532da84b2c7c4b2c7f2407ec0200201481a1b02012008090135b44104601bc16d674ec8000175366104604b728dd78166c2e7c61d0a01f7b504600c55f7bc23038e384504601bc16d674ec800015308430420773594015104601bc16d674ec8000153090460094079cd1a42aaaa05042077359401502504601bc16d674ec800015308a0074025040186b0438001e5e504601bc16d674ec800000353090460094079cd1a42aaaab104601bc16d674ec8000153091402fc8200c354218235c702bd3a30fc0000be228238070c1cc73b00c80000bbb0f2f420c1008e1282300de0b6b3a76400005202a3f01212a984e020821b782dace9d9aa18be8e2820821b782dace9d9aa17be8e18821b782dace9d9aa17a182501425982cf597cd205cef73809171e2e30d01a7648238056bc75e2d63100000210b0c0042821b782dace9d9aa18a18288195e54c5dd42177f53a27172fa9ec630262827aa2303fc822056bc75e2d631aa18be8e1c30822056bc75e2d631aa18a18261855144814a7ff805980ff0084000de21822056bc75e2d631aa17be8e2701822056bc75e2d631aa17a101824adf0ab5a80a22c61ab5a7008238056bc75e2d63100000a984de21822056bc75e2d631aa16bee30021823815af1d78b58c400000bee300210d0e0f004c01822056bc75e2d631aa16a10182403f1fce3da636ea5cf8508238056bc75e2d63100000a984004c01823815af1d78b58c400000a101823927fa27722cc06cc5e28238056bc75e2d63100000a98402f482380ad78ebc5ac6200000be8e260182380ad78ebc5ac6200000a1018238280e60114edb805d038238056bc75e2d63100000a984de218238056bc75e2d63100000be8e26018238056bc75e2d63100000a10182380ebc5fb417461211108238056bc75e2d63100000a984de218232b5e3af16b1880000bee300211011004a018232b5e3af16b1880000a101823808f00f760a4b2db55d8238056bc75e2d63100000a98401ec82315af1d78b58c40000be8e250182315af1d78b58c40000a101823806f5f17757889379378238056bc75e2d63100000a984de218238056bc75e2d6310000021a0511382380ad78ebc5ac6200000a98466a0511382381043561a8829300000a98466a05113823815af1d78b58c400000a98466a051131201ea82381b1ae4d6e2ef500000a98466a0511382382086ac351052600000a98466a05113823825f273933db5700000a98466a05113822056bc75e2d631aa16a98466a05113823830ca024f987b900000a98466a0511382383635c9adc5dea00000a98466a0511382383ba1910bf341b00000a98466a0031300428238410d586a20a4c00000a98412a08238056bc75e2d63100000a984018064a9840002a101a5bd48ff800fc257c22fc277c2691aa0a108a6d9e298950a91054c352290109d4c200fc20fc217c24387c257c25fc267c26fc277c27fc227c21fc23fc24886f8867085e8856084d8845083c8834082b88230822c180299bd93a7800fc25387c26fc277c22aa3aa1d0aa3ba1d4c228c450aa3b1bed9e2980de474c98189b289ad01281a0a2ed9e298950a91054c3290109d4c22cca98a82b2f82f118106080c9adb810704171801d20382103b9aca00a80282103b9aca00a82382103b9aca00a801a1547013f01a823004a03ce68d2155550582103b9aca00a81582300de0b6b3a7640000a98401a0522082300de0b6b3a7640000a984823004a03ce68d2155555882300de0b6b3a7640000a98458a058a01901d80282103b9aca00a80382103b9aca00a82282103b9aca00a85004a1547012f01a823004a03ce68d215555500382300de0b6b3a7640000a98458a0523082300de0b6b3a7640000a984823004a03ce68d2155550382103b9aca00a81382300de0b6b3a7640000a9845003a058a019003c8200c35821c000f2f282300de0b6b3a764000001a98482103b9aca00a9040201201c1d0143688208c03782dace9d900002e6384608c03782dace9d900001480aa613c01a8f8c3a440201201e1f00834f84ef84df849f847c8ccccf848cf16f84afa02f84bfa02f84ccf16cb0fcb0ff84ffa02c9f844f843c8f841cf16f842fa02cb3fca00f845fa02f846cf16ccc9ed54804f70c8871c02497c0f83434c0c05c6c2497c0f83e900c0074c7f4cffc0048a08435ead3d06eb8c08c4860841f65754c2ea38516fe1071c17cb8127e10406082bebc20285c3c09380cc820842703cc882ea3850c3e10548431c17cb8124075347ec11c20103c093808208411ba7c76eeb8c08820842f67479f6eb8c088202021222300a33b51343e90007e187e80007e18b4cfc07e18f480007e193e80007e197e90007e19b5007435007e19f5007e1a7e90007e1a3e80007e1abe80007e1afe90007e1b34c3c07e1b74c3c07e1bbe80007e1bf4746002fe6c2232f844f2e04af84274fb0201d4fa40d4f40430f825f8158010f8118874f40e6fa1f2e191fa40fa4030c858cf1601cf16c971f84ef84dc8f84afa02f84bfa025007cf16f84ccf1616cb0f15cb0f14cb0012cc14cb3ff84ffa02ccc970f849c822fa02f848cf1614cc13cc12cb1f70fa02f845fa02f846cf16ccc9f847012425002830f8415210c705f2e04901d4d1ed54708040f024003030f8415210c705f2e04901d4d4d101fb04ed54708040f02400988210c397341bba9e30f841c705f2e049d4d30730fb00e020821054e08f3fba9f30f841c705f2e049d200d1f864f002e08210f1e7555eba9ef841c705f2e049fa00d1f865f002e05b840ff2f0020120262700787020c8cb0113f400f400cb00c920f9007074c8cb02ca07cbffc9d0226e9332c8c99102e2778018c8cb055004cf1670fa0213cb6bccccc9810090fb00020120282902012036370201202a2b02012030310201202c2d0201202e2f00862004970a08d72a3449799d964544f5481c86c7fa67ddc8bd321dc8f39fb837edce8c009220c181a6cfeacd11b7b8f62138df1bb9cc82b6ed2661d2f5faee204b3efb2000862001907d9de057aaea3e00212e57ef4f8e46b13e2d5b6a9788196eae6717243e49fc0032bdc9cfd117b12ef9ec40c5df2989e4d7c07397763e886b7a6d7a8507be6e81008620078fdf46a29e9ea5a3cb69ec32bf783b99116891ec6e533e4f79d6691337a04bbc00f03b20e57b01b0f0c91e5e067fa0e98f4c8849225689c212667f87df20f2affb0086200115fb91762c01d3230974e740ca49dc6039b74c7822dad869efcb5827d154514400205edc9096a545d95dc5e262a56ef6335228e51a352625b3d6916ba214d769cd020120323302012034350086200215b29bdb397bd558fdbe43e8c45c2ba246da87de22dc2c346d9d72605c0f83f40041fdd4e21babb82086c34fcd328abab098ba70469edc0c691dae6bd0dd7b3fdf008620058e83864fe1e25e21a4864fd8254391e23675ccf9417bb33c1fa8b5dd6c6bc9cc00b3522cfb4c54bba7b072617b7e7379490e6c86be61d34089b4be1c128a289a2e008620068751f3bd5b6a3dccdb8754392cdde7c16a6ce0dd25b1c55f4a49183f3c78ef7400d3c7aa3b8261a8f1cb89b7fdc41c480ed519869cbb464f38133ac1b9a4062cd2008620070f340e7defa381f76cd9c88230541621dc2c832517c3f272187ac193af1a37b400e2c76a8c39cf903b4e4d9fd5fba0a1676136f76efb7137bc929b3a06963ac5bf02012038390201203e3f0201203a3b0201203c3d008620041a7eba127ced4bafd859ab68f7551fca7bb9055d99c29077b6720cc407ebddb4008281370912e80c0a642324324b4c596ee7aa1df5f2437e44d236fe10106a478a00862003900197ca2d6cecaed66240b96c0fa536cbecb6a7f5a9aaadb22c06df8f126924007321efca606adece6492dee6bd6ee3343fcbf31273050ebb2fd69ac59f03f8de0086200287ea0285e8fb5e4a465078451db445965035b2d2fd913374c7904ba49f0e1c3c0053602c7b4c681581a22bdedb89debffdd44e855010562ed4fbde54d8626ac87300862000830dcedea20c568b37e4d26f788b717b63a795fdb8738f9329eb21e77ff5fd4c0011675845e2ff7910bb07ee908f30defdfd47aa28e3a03a3b7cc6b916f47848330201204041020120424300862000188298999385f417737eca68cb1e00c3434201d27a9b820506a99d55c02dbd7c0002bb3d79d6c9e5638e8f29d50e9328827f4cf373132c37a5e62909122998e4bf0086200601f93dd8e01e0012f0b2f4e7cc6704ec2fec3fb0fa8492668a1f7457375915cc00c15e924172d00a95b00c5aa1f68933f204f7dd04f79067a086469d68281a90900086200314064edb1c1aa6b760edf9bd5daaf335ffe4477b79b23f3efaddaec8ab1e22ac00622c7b908c38f87cdc820fb0a1e47c2934695d95be60f8b330435912b50e0d33008620051654d00ac69021f2b55834e9c28f1f9091f398fa3218f8dc89b513aac863b8a400a3128ed03541f94b6b558d880515d121d6985eaf2747f4afa7ac7c7469272cab01fe702182b05803bcc5cb9634ba4cfb2213f784019318ed4dcb6017880faa35be8e23308288195e54c5dd42177f53a27172fa9ec630262827aa23a904821b782dace9d9aa18de2182708bcc0026baae9e45e470190267a230cfaa18be8e1c0182501425982cf597cd205cef7380a90401821b782dace9d9aa17a0dea76401a7644501f2208261855144814a7ff805980ff0084000be8e2a8238056bc75e2d631000008261855144814a7ff805980ff0084000a98401822056bc75e2d631aa18a001de20824adf0ab5a80a22c61ab5a700be8e278238056bc75e2d63100000824adf0ab5a80a22c61ab5a700a98401822056bc75e2d631aa17a001de204602f882403f1fce3da636ea5cf850be8e268238056bc75e2d6310000082403f1fce3da636ea5cf850a98401822056bc75e2d631aa16a001de20823927fa27722cc06cc5e2be8e268238056bc75e2d63100000823927fa27722cc06cc5e2a98401823815af1d78b58c400000a001de208238280e60114edb805d03bee300204748004c8238056bc75e2d631000008238280e60114edb805d03a9840182380ad78ebc5ac6200000a00102f482380ebc5fb41746121110be8e268238056bc75e2d6310000082380ebc5fb41746121110a984018238056bc75e2d63100000a001de20823808f00f760a4b2db55dbe8e258238056bc75e2d63100000823808f00f760a4b2db55da984018232b5e3af16b1880000a001de20823806f5f1775788937937bee30020494a004a8238056bc75e2d63100000823806f5f1775788937937a9840182315af1d78b58c40000a00101ec823806248f33704b286603be8e258238056bc75e2d63100000823806248f33704b286603a984018230ad78ebc5ac620000a001de20823805c548670b9510e7acbe8e258238056bc75e2d63100000823805c548670b9510e7aca98401823056bc75e2d6310000a001de208238056bc75e2d63100000a14b01fe8238056bc75e2d631000005122a012a98453008238056bc75e2d63100000a9845c8238056bc75e2d63100000a9842073a90413a051218238056bc75e2d63100000a9842075a90413a051218238056bc75e2d63100000a9842077a90413a051218238056bc75e2d63100000a9842079a90413a0598238056bc75e2d631000004c001ca984800ba904a0aa00a08064a904';
  const buffer = Buffer.from(hexCode, 'hex');
  const code = Cell.fromBoc(buffer)[0];
  console.log('✅ Bytecode BCL master загружен из hex');

  // Парсим адрес для комиссий
  const feeAddress = Address.parse(FEE_ADDRESS);
  console.log('✅ Адрес для комиссий:', feeAddress.toString({ urlSafe: true, bounceable: false }));

  // Создаем начальные данные
  console.log('🔨 Создание начальных данных...');
  const initialData = createInitialData({
    admin: contract.address, // Админ = адрес кошелька
    authorAddress: contract.address, // Автор = адрес кошелька
    feeAddress: feeAddress, // ⭐ ВАШ АДРЕС ДЛЯ КОМИССИЙ
    maxTon: toNano(FULL_PRICE_TON), // ⭐ 300 TON
    bclSupply: BigInt(BCL_SUPPLY),
    liqSupply: BigInt(LIQ_SUPPLY),
    tradeFeeNumerator: TRADE_FEE_NUMERATOR,
    tradeFeeDenominator: TRADE_FEE_DENOMINATOR,
    content: beginCell().storeUint(0, 1).endCell(), // Пустой content (можно добавить метаданные)
    walletCode: walletCode, // Код кошелька jetton
  });

  // Создаем StateInit
  const { stateInit, address } = createStateInit(code, initialData);

  console.log('\n✅ BCL Master Contract Address:', address.toString({ urlSafe: true, bounceable: false }));
  console.log('📊 Параметры:');
  console.log('   - fullPriceTon:', FULL_PRICE_TON, 'TON');
  console.log('   - feeAddress:', feeAddress.toString({ urlSafe: true, bounceable: false }));
  console.log('   - BCL Supply:', BCL_SUPPLY.toLocaleString());
  console.log('   - Liquidity Supply:', LIQ_SUPPLY.toLocaleString());
  console.log('   - Trade Fee:', TRADE_FEE_NUMERATOR + '/' + TRADE_FEE_DENOMINATOR, '=' + (TRADE_FEE_NUMERATOR / TRADE_FEE_DENOMINATOR * 100) + '%');

  // Получаем seqno для транзакции (пропускаем проверку баланса из-за rate limit)
  console.log('\n📤 Получение seqno для транзакции...');
  let seqno: number;
  let seqnoRetries = 5;
  
  while (seqnoRetries > 0) {
    try {
      seqno = await contract.getSeqno();
      console.log('✅ Seqno получен:', seqno);
      break;
    } catch (error: any) {
      if (error.status === 429 || error.response?.status === 429 || error.message?.includes('rate limit') || error.message?.includes('429') || error.message?.includes('Превышен')) {
        seqnoRetries--;
        if (seqnoRetries > 0) {
          const waitTime = (6 - seqnoRetries) * 30; // 30, 60, 90, 120, 150 секунд
          console.log(`⚠️ Rate limit, ждем ${waitTime} секунд перед повтором... (осталось попыток: ${seqnoRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        } else {
          console.error('❌ Превышен лимит запросов. Попробуйте позже (через 5-10 минут) или используйте другой API endpoint.');
          process.exit(1);
        }
      } else {
        throw error;
      }
    }
  }
  
  console.log('\n📤 Отправка транзакции развертывания (seqno:', seqno, ')...');
  
  // Повторяем отправку при rate limit
  let sendRetries = 5;
  while (sendRetries > 0) {
    try {
      await contract.sendTransfer({
        secretKey: key.secretKey,
        seqno,
        messages: [
          internal({
            to: address,
            value: toNano('0.1'), // Gas для развертывания
            init: stateInit,
            body: beginCell().endCell(), // Пустое тело
          }),
        ],
      });
      break; // Успешно отправлено
    } catch (error: any) {
      if (error.status === 429 || error.response?.status === 429 || error.message?.includes('rate limit') || error.message?.includes('429') || error.message?.includes('Превышен')) {
        sendRetries--;
        if (sendRetries > 0) {
          const waitTime = (6 - sendRetries) * 30; // 30, 60, 90, 120, 150 секунд
          console.log(`⚠️ Rate limit при отправке, ждем ${waitTime} секунд... (осталось попыток: ${sendRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        } else {
          console.error('❌ Превышен лимит запросов при отправке. Попробуйте позже (через 5-10 минут) или используйте другой API endpoint.');
          process.exit(1);
        }
      } else {
        throw error;
      }
    }
  }

  console.log('✅ Транзакция развертывания отправлена!');
  console.log('\n📋 Следующие шаги:');
  console.log('1. Дождитесь подтверждения транзакции (обычно 5-10 секунд)');
  console.log('2. Проверьте контракт на блокчейне:');
  console.log('   https://tonscan.org/address/' + address.toString({ urlSafe: true, bounceable: false }));
  console.log('3. Обновите MASTER_ADDRESS в src/config.ts на:');
  console.log('   ' + address.toString({ urlSafe: true, bounceable: false }));
  console.log('4. Перезапустите приложение');
}

// Запуск
deploy().catch((error) => {
  console.error('❌ Ошибка при развертывании:', error);
  process.exit(1);
});
