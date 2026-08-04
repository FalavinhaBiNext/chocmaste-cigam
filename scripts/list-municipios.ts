import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { container } from '../src/shared/container';
import { CigamHttpClient } from '../src/modules/cigam/services/cigamHttpClient';
import { UsuarioCigamService } from '../src/modules/usuarioCigam/services/usuarioCigamService';

async function run() {
  try {
    const service = container.resolve(UsuarioCigamService);
    const client = container.resolve(CigamHttpClient);
    const user = await service.findByEnv('Producao');
    if (!user) throw new Error('No user');

    console.log('Buscando todos os municípios no CIGAM para filtrar em memória...');
    const result: any = await client.get(
      user.url_ambiente,
      'Producao',
      '/API/api/genericos/ge/Municipio/Buscar'
    );
    
    if (Array.isArray(result)) {
      const santoAndre = result.find((m: any) => 
        m.NomeMunicipio?.trim().toUpperCase() === 'SANTO ANDRE' && 
        m.UF?.trim().toUpperCase() === 'SP'
      );
      console.log('Município "SANTO ANDRE - SP" localizado em memória:', santoAndre);

      const spCity = result.find((m: any) => 
        m.NomeMunicipio?.trim().toUpperCase() === 'SP' || 
        m.UF?.trim().toUpperCase() === 'SP' && m.NomeMunicipio?.trim().toUpperCase() === 'SAO PAULO'
      );
      console.log('Município "SP" ou Capital SP em memória:', spCity);
    } else {
      console.log('Resposta não é uma lista:', result);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

run();
