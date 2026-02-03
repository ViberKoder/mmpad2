/**
 * Скрипт для развертывания BCL Master Factory контракта
 * 
 * Этот контракт является мастер-контрактом (factory), который:
 * - Имеет метод get_factory_data для получения параметров деплоя
 * - Деплоит новые BCL контракты с кастомными параметрами
 * 
 * Параметры:
 * - fullPriceTon: 300 TON (вместо 3 TON)
 * - feeAddress: UQDjQOdWTP1bPpGpYExAsCcVLGPN_pzGvdno3aCk565ZnQIz
 */

import { Address, beginCell, Cell, toNano, internal, StateInit, storeStateInit } from '@ton/core';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';
import * as fs from 'fs';
import * as path from 'path';

// ========== КОНФИГУРАЦИЯ ==========
const YOUR_FEE_ADDRESS = Address.parse('UQDjQOdWTP1bPpGpYExAsCcVLGPN_pzGvdno3aCk565ZnQIz');
const YOUR_ADMIN_ADDRESS = YOUR_FEE_ADDRESS;

// Параметры BCL контракта
const BCL_SUPPLY = toNano('1000000000'); // Общее количество токенов BCL
const LIQ_SUPPLY = toNano('500000000'); // Количество токенов для ликвидности
const TRADE_FEE_NUMERATOR = 5; // 5%
const TRADE_FEE_DENOMINATOR = 100;
const MAX_TON_FOR_BONDING = toNano('300'); // 300 TON для бондинга

// Bytecode BCL master контракта (из предыдущего развертывания)
const BCL_MASTER_BYTECODE_HEX = 'b5ee9c7201024d0100103d000114ff00f4a413f4bcf2c80b0102016202030202ca0405020120151602012006070047a920843c27e4635c0820063232c15401b3c594013e808532da84b2c7c4b2c7f2407ec0200201481a1b02012008090135b44104601bc16d674ec8000175366104604b728dd78166c2e7c61d0a01f7b504600c55f7bc23038e384504601bc16d674ec800015308430420773594015104601bc16d674ec8000153090460094079cd1a42aaaa05042077359401502504601bc16d674ec800015308a0074025040186b0438001e5e504601bc16d674ec800000353090460094079cd1a42aaaab104601bc16d674ec8000153091402fc8200c354218235c702bd3a30fc0000be228238070c1cc73b00c80000bbb0f2f420c1008e1282300de0b6b3a76400005202a3f01212a984e020821b782dace9d9aa18be8e2820821b782dace9d9aa17be8e18821b782dace9d9aa17a182501425982cf597cd205cef73809171e2e30d01a7648238056bc75e2d63100000210b0c0042821b782dace9d9aa18a18288195e54c5dd42177f53a27172fa9ec630262827aa2303fc822056bc75e2d631aa18be8e1c30822056bc75e2d631aa18a18261855144814a7ff805980ff0084000de21822056bc75e2d631aa17be8e2701822056bc75e2d631aa17a101824adf0ab5a80a22c61ab5a7008238056bc75e2d63100000a984de21822056bc75e2d631aa16bee30021823815af1d78b58c400000bee30021393a3b004c01822056bc75e2d631aa16a10182403f1fce3da636ea5cf8508238056bc75e2d63100000a984004c01823815af1d78b58c400000a101823927fa27722cc06cc5e28238056bc75e2d63100000a98402f482380ad78ebc5ac6200000be8e260182380ad78ebc5ac6200000a1018238280e60114edb805d038238056bc75e2d63100000a984de218238056bc75e2d63100000be8e26018238056bc75e2d63100000a10182380ebc5fb417461211108238056bc75e2d63100000a984de218232b5e3af16b1880000bee300213c3d004a018232b5e3af16b1880000a101823808f00f760a4b2db55d8238056bc75e2d63100000a98401ec82315af1d78b58c40000be8e250182315af1d78b58c40000a101823806f5f17757889379378238056bc75e2d63100000a984de218238056bc75e2d6310000021a0511382380ad78ebc5ac6200000a98466a0511382381043561a8829300000a98466a05113823815af1d78b58c400000a98466a051133e01ea82381b1ae4d6e2ef500000a98466a0511382382086ac351052600000a98466a05113823825f273933db5700000a98466a05113822056bc75e2d631aa16a98466a05113823830ca024f987b900000a98466a0511382383635c9adc5dea00000a98466a0511382383ba1910bf341b00000a98466a0033f00428238410d586a20a4c00000a98412a08238056bc75e2d63100000a984018064a98401f7bd04600c55f7bc23038e384504601bc16d674ec800015308430420773594015104601bc16d674ec8000153090460094079cd1a42aaaa05042077359401502504601bc16d674ec800015308a0074025040186b0438001e5e504601bc16d674ec800000353090460094079cd1a42aaaab104601bc16d674ec800015309420045fc108784fc8c6b8104008646582a803678b28027d010a65b509658f89658fe480fd8040002a1';

// Получаем код jetton wallet из существующего контракта
async function getJettonWalletCode(client: TonClient): Promise<Cell> {
  // Используем стандартный код jetton wallet из известного контракта
  const knownJettonMaster = Address.parse('EQD4FPq-PRDieyQKkO5Fm8Tnsg6p4qN1kP5J5N5J5N5J5N5J5N');
  try {
    const state = await client.getContractState(knownJettonMaster);
    if (state.code) {
      const data = state.code.beginParse();
      // Пропускаем первые данные и получаем wallet_code
      data.loadCoins(); // total_supply
      data.loadAddress(); // admin
      const walletCode = data.loadRef();
      return walletCode;
    }
  } catch (e) {
    console.log('Не удалось получить wallet code из контракта, используем стандартный');
  }
  
  // Если не получилось, используем стандартный код
  // Это упрощенная версия - в реальности нужно получить правильный код
  return beginCell().endCell();
}

/**
 * Создает начальные данные для Master Factory контракта
 */
function createMasterFactoryData(params: {
  bclCode: Cell;
  walletCode: Cell;
  maxTon: bigint;
  feeAddress: Address;
  bclSupply: bigint;
  liqSupply: bigint;
  tradeFeeNumerator: number;
  tradeFeeDenominator: number;
  admin: Address;
  seed: bigint;
}): Cell {
  return beginCell()
    .storeRef(params.bclCode) // bcl_code
    .storeUint(0, 1) // zero
    .storeRef(params.walletCode) // wallet_code
    .storeUint(0, 1) // zero
    .storeCoins(params.maxTon) // max_ton
    .storeCoins(params.liqSupply) // liq_supply
    .storeAddress(params.feeAddress) // fee_address
    .storeUint(1, 1) // enabled
    .storeUint(params.tradeFeeNumerator, 16) // trade_fee_numerator
    .storeUint(params.tradeFeeDenominator, 16) // trade_fee_denominator
    .storeUint(0, 1) // zero
    .storeUint(params.seed, 64) // seed
    .storeAddress(params.admin) // admin
    .endCell();
}

/**
 * Создает StateInit для развертывания контракта и вычисляет адрес
 */
function createStateInit(code: Cell, data: Cell): { stateInit: StateInit; address: Address } {
  // StateInit - это структура с code и data
  const stateInit: StateInit = { code, data };
  
  // Вычисляем адрес из StateInit
  const stateInitCell = beginCell()
    .store(storeStateInit(stateInit))
    .endCell();
  const stateInitHash = stateInitCell.hash();
  const workchain = 0;
  const address = new Address(workchain, stateInitHash);
  
  return { stateInit, address };
}

// ========== ГЛАВНАЯ ФУНКЦИЯ РАЗВЕРТЫВАНИЯ ==========

async function deploy() {
  console.log('🚀 Начинаем развертывание BCL Master Factory контракта...');

  // Настройка клиента TON
  const client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: process.env.TONCENTER_API_KEY,
  });

  // Загрузка кошелька из мнемоники
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) {
    console.error('❌ Мнемоника не найдена. Установите переменную окружения MNEMONIC.');
    process.exit(1);
  }
  const key = await mnemonicToWalletKey(mnemonic.split(' '));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  const contract = client.open(wallet);

  console.log('📝 Адрес кошелька:', contract.address.toString({ urlSafe: true, bounceable: false }));

  // Получаем код рабочего мастер-контракта
  console.log('📦 Получение кода рабочего мастер-контракта...');
  const workingMasterAddress = Address.parse('EQBSMwczMFUb789uqNvebKBvemkRaAQJdzTFq6565Ef9rW2k');
  const workingState = await client.getContractState(workingMasterAddress);
  
  if (!workingState.code) {
    throw new Error('Не удалось получить код рабочего мастер-контракта');
  }
  
  // Преобразуем код в Cell, если это Buffer
  const masterCode = workingState.code instanceof Cell ? workingState.code : Cell.fromBoc(workingState.code)[0];
  console.log('✅ Код мастер-контракта получен');
  console.log('   Master code bits:', masterCode.bits.length, 'refs:', masterCode.refs.length);

  // Получаем BCL код из развернутого BCL контракта (если активен)
  console.log('📦 Получение BCL кода...');
  let bclCode: Cell;
  const bclContractAddress = Address.parse('UQCYEPeADv6F9S9orOHA1OX7y0z4D-b43cEZ-71aN2EB3Am3');
  const bclState = await client.getContractState(bclContractAddress);
  
  if (bclState.code && bclState.state === 'active') {
    bclCode = bclState.code;
    console.log('✅ BCL код получен из развернутого контракта');
  } else {
    // Используем код из рабочего мастер-контракта через get_factory_data
    console.log('📦 Получение BCL кода через get_factory_data...');
    const masterAddressHex = Buffer.from(workingMasterAddress.hash).toString('hex');
    const factoryDataUrl = `https://tonapi.io/v2/blockchain/accounts/${workingMasterAddress.workChain}:${masterAddressHex}/methods/get_factory_data`;
    
    try {
      const response = await fetch(factoryDataUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success && data.stack && data.stack.length >= 3) {
        // Первый элемент - bcl_code (cell)
        const bclCodeCell = data.stack[0].cell;
        // Данные приходят в формате base64 BOC
        try {
          // Пробуем base64
          const bclCodeBuffer = Buffer.from(bclCodeCell, 'base64');
          const cells = Cell.fromBoc(bclCodeBuffer);
          if (cells.length > 0) {
            bclCode = cells[0];
          } else {
            throw new Error('Пустой BOC');
          }
        } catch (e1) {
          // Если не base64, пробуем hex
          try {
            const bclCodeBuffer = Buffer.from(bclCodeCell, 'hex');
            const cells = Cell.fromBoc(bclCodeBuffer);
            if (cells.length > 0) {
              bclCode = cells[0];
            } else {
              throw new Error('Пустой BOC');
            }
          } catch (e2) {
            throw new Error('Не удалось декодировать BCL код: ' + e1.message);
          }
        }
        console.log('✅ BCL код получен через get_factory_data');
      } else {
        throw new Error('Неверный формат ответа от get_factory_data');
      }
    } catch (e) {
      // Используем код мастер-контракта как BCL код (они могут быть одинаковыми)
      console.log('⚠️  Используем код мастер-контракта как BCL код');
      bclCode = masterCode;
    }
  }

  // Получаем wallet code через get_factory_data
  console.log('📦 Получение wallet code...');
  let walletCode: Cell;
  const masterAddressHex = Buffer.from(workingMasterAddress.hash).toString('hex');
  const factoryDataUrl = `https://tonapi.io/v2/blockchain/accounts/${workingMasterAddress.workChain}:${masterAddressHex}/methods/get_factory_data`;
  
  try {
    const response = await fetch(factoryDataUrl);
    const data = await response.json();
    
    if (data.success && data.stack && data.stack.length >= 3) {
      // Третий элемент - wallet_code (cell)
      const walletCodeCell = data.stack[2].cell;
      try {
        const walletCodeBuffer = Buffer.from(walletCodeCell, 'base64');
        const cells = Cell.fromBoc(walletCodeBuffer);
        if (cells.length > 0) {
          walletCode = cells[0];
        } else {
          throw new Error('Пустой BOC');
        }
      } catch (e1) {
        try {
          const walletCodeBuffer = Buffer.from(walletCodeCell, 'hex');
          const cells = Cell.fromBoc(walletCodeBuffer);
          if (cells.length > 0) {
            walletCode = cells[0];
          } else {
            throw new Error('Пустой BOC');
          }
        } catch (e2) {
          throw new Error('Не удалось декодировать wallet code: ' + e1.message);
        }
      }
      console.log('✅ Wallet code получен через get_factory_data');
    } else {
      throw new Error('Неверный формат ответа');
    }
  } catch (e) {
    // Получаем wallet code из стандартного jetton контракта
    console.log('⚠️  Получаем wallet code из стандартного jetton контракта...');
    const knownJettonMaster = Address.parse('EQD4FPq-PRDieyQKkO5Fm8Tnsg6p4qN1kP5J5N5J5N5J5N5J5N');
    const jettonState = await client.getContractState(knownJettonMaster);
    if (jettonState.data) {
      const dataCell = jettonState.data instanceof Cell ? jettonState.data : Cell.fromBoc(jettonState.data)[0];
      const dataSlice = dataCell.beginParse();
      dataSlice.loadCoins(); // total_supply
      dataSlice.loadAddress(); // admin
      walletCode = dataSlice.loadRef(); // wallet_code
      console.log('✅ Wallet code получен из стандартного jetton контракта');
    } else {
      throw new Error('Не удалось получить wallet code');
    }
  }


  // Проверяем, что коды являются Cell
  if (!(bclCode instanceof Cell)) {
    throw new Error('BCL код не является Cell, тип: ' + typeof bclCode);
  }
  if (!(walletCode instanceof Cell)) {
    throw new Error('Wallet код не является Cell, тип: ' + typeof walletCode);
  }

  console.log('✅ Проверка кодов пройдена');
  console.log('   BCL code bits:', bclCode.bits.length, 'refs:', bclCode.refs.length);
  console.log('   Wallet code bits:', walletCode.bits.length, 'refs:', walletCode.refs.length);

  // Создаем данные для мастер-контракта с нашими параметрами
  console.log('📝 Создание данных для мастер-контракта...');
  let factoryData: Cell;
  try {
    factoryData = createMasterFactoryData({
      bclCode,
      walletCode,
      maxTon: MAX_TON_FOR_BONDING,
      feeAddress: YOUR_FEE_ADDRESS,
      bclSupply: BCL_SUPPLY,
      liqSupply: LIQ_SUPPLY,
      tradeFeeNumerator: TRADE_FEE_NUMERATOR,
      tradeFeeDenominator: TRADE_FEE_DENOMINATOR,
      admin: YOUR_ADMIN_ADDRESS,
      seed: 0n,
    });
    console.log('✅ Данные созданы успешно');

  console.log('📝 Параметры:');
  console.log('   - Max TON:', Number(MAX_TON_FOR_BONDING) / 1e9);
  console.log('   - Fee Address:', YOUR_FEE_ADDRESS.toString({ urlSafe: true }));
  console.log('   - Admin:', YOUR_ADMIN_ADDRESS.toString({ urlSafe: true }));

  } catch (e) {
    console.error('❌ Ошибка при создании данных:', e);
    throw e;
  }

  // Проверяем masterCode
  if (!(masterCode instanceof Cell)) {
    throw new Error('Master код не является Cell');
  }
  console.log('✅ Master code проверен, bits:', masterCode.bits.length, 'refs:', masterCode.refs.length);

  // Создаем StateInit и вычисляем адрес
  const { stateInit, address: newAddress } = createStateInit(masterCode, factoryData);
  
  console.log('📝 Адрес нового контракта:', newAddress.toString({ urlSafe: true, bounceable: false }));
  
  // Проверяем, не развернут ли уже контракт
  let existingState;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      existingState = await client.getContractState(newAddress);
      break;
    } catch (e: any) {
      if (e.response?.status === 429 || e.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      throw e;
    }
  }
  
  if (existingState && existingState.state === 'active') {
    console.log('⚠️  Контракт уже развернут!');
    console.log('📝 Адрес:', newAddress.toString({ urlSafe: true, bounceable: false }));
    return;
  }

  // Проверяем баланс кошелька с retry для rate limit
  let balance: bigint;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      balance = await contract.getBalance();
      break;
    } catch (e: any) {
      if (e.response?.status === 429 || e.status === 429) {
        const delay = Math.min(2000 * Math.pow(2, attempt), 10000);
        console.log(`⏳ Rate limit, ждем ${delay}ms... (попытка ${attempt + 1}/5)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw e;
    }
  }
  console.log('💰 Баланс кошелька:', Number(balance!) / 1e9, 'TON');

  if (balance! < toNano('0.1')) {
    throw new Error('Недостаточно средств для развертывания. Нужно минимум 0.1 TON');
  }

  // Получаем seqno для транзакции
  console.log('📤 Получение seqno...');
  let seqno: number;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      seqno = await contract.getSeqno();
      console.log('✅ Seqno получен:', seqno);
      break;
    } catch (e: any) {
      if (e.response?.status === 429 || e.status === 429) {
        const delay = Math.min(2000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw e;
    }
  }

  // Развертываем контракт с retry для rate limit
  console.log('🚀 Развертывание контракта...');
  let txSent = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      // Используем уже созданный StateInit

      // Увеличиваем значение для газа
      await contract.sendTransfer({
        secretKey: key.secretKey,
        seqno: seqno!,
        messages: [
          internal({
            to: newAddress,
            value: toNano('0.1'), // Увеличено для надежности
            init: stateInit,
            body: beginCell().endCell(),
            bounce: false,
          })
        ],
      });
      txSent = true;
      console.log('✅ Транзакция развертывания отправлена!');
      break;
    } catch (e: any) {
      if (e.response?.status === 429 || e.status === 429) {
        const delay = Math.min(3000 * Math.pow(2, attempt), 15000);
        console.log(`⏳ Rate limit при отправке, ждем ${delay}ms... (попытка ${attempt + 1}/5)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      // Логируем другие ошибки для отладки
      if (attempt === 0) {
        console.error('Ошибка при отправке транзакции:', e.message);
      }
      throw e;
    }
  }

  if (!txSent) {
    throw new Error('Не удалось отправить транзакцию после 5 попыток');
  }
  console.log('📝 Адрес развернутого контракта:', newAddress.toString({ urlSafe: true, bounceable: false }));
  console.log('⏳ Ожидайте подтверждения транзакции (обычно 5-10 секунд)...');

  // Ждем подтверждения с retry для rate limit
  let confirmed = false;
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const state = await client.getContractState(newAddress);
      if (state.state === 'active') {
        confirmed = true;
        console.log('✅ Контракт успешно развернут и активен!');
        break;
      }
      process.stdout.write('.');
    } catch (e: any) {
      if (e.response?.status === 429 || e.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      // Игнорируем другие ошибки при проверке состояния
    }
  }

  if (!confirmed) {
    console.log('\n⚠️  Контракт еще не активен, но транзакция отправлена. Проверьте позже.');
  }

  console.log('\n📝 Обновите MASTER_ADDRESS в src/config.ts на:');
  console.log(newAddress.toString({ urlSafe: true, bounceable: false }));
}

deploy().catch(console.error);
