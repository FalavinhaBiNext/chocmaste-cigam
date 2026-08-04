import { injectable, inject } from "tsyringe";
import { CreateUsuarioCigamDTO, ResponseUsuarioCigamDTO } from "../dto";
import { UsuarioCigamRepository } from "../repositories/UsuarioCigamRepository";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";


@injectable()
export class UsuarioCigamService {
    constructor(
        @inject(UsuarioCigamRepository)
        private readonly usuarioCigamRepository: UsuarioCigamRepository
    ) {}

    async create(data: CreateUsuarioCigamDTO): Promise<ResponseUsuarioCigamDTO>{
        logger.info('Starting usuario cigam creation')
        logger.event('Performing data processing')
        
        // Deactivate all other users since new user is active by default
        const allUsers = await this.usuarioCigamRepository.findAll();
        for (const user of allUsers) {
            if (user.ativo) {
                await this.usuarioCigamRepository.alterAtivo(user.id, false);
            }
        }

        const usuarioCigam = await this.usuarioCigamRepository.create(data)
        logger.success('Usuario Cigam created successfully')
        return usuarioCigam
    }

    async findAll(): Promise<ResponseUsuarioCigamDTO[]>{
        logger.info('Searching all Usuarios Cigam')
        const usuariosCigam = await this.usuarioCigamRepository.findAll()
        logger.success(`${usuariosCigam.length} Usuario Cigam retrevied`)
        return usuariosCigam
    }

    async findById(id: string): Promise<ResponseUsuarioCigamDTO | null>{
        logger.info(`Searching Usuario Cigam with ID: ${id}`)
        const usuarioCigam = await this.usuarioCigamRepository.findById(id);
        if(!usuarioCigam){
            logger.error(`Usuario Cigam with ID: ${id} not found`)
            throw new NotFoundError(`Usuario Cigam with ID: ${id} not found`)
        }
        logger.finish('Usuario Cigam found...')
        return usuarioCigam
    }

    async findByEnv(env: string): Promise<ResponseUsuarioCigamDTO | null> {
        logger.info(`Searching Usuario Cigam with env: ${env}`)
        const usuarioCigam = await this.usuarioCigamRepository.findByEnv(env)

        if(!usuarioCigam){
            logger.error('Usuario Cigam não encontrado a env atual')
            throw new NotFoundError(`Usuario Cigam not found with env: ${env}`)
        }

        logger.success('Usuario Cigam found')
        return usuarioCigam
    }

    async update(id: string, data: any): Promise<void>{
        logger.info(`Starting Update Usuario Cigam with ID: ${id}`)
        logger.event(`Searching Usuario Cigam with ID: ${id}`)
        const usuarioExistente = await this.usuarioCigamRepository.findById(id)
        if(!usuarioExistente){
            logger.error('Usuario Cigam Not Found')
            throw new NotFoundError(`Usuario Cigam with ID: ${id} not found`)
        }
        
        if (data.ativo === true) {
            const allUsers = await this.usuarioCigamRepository.findAll();
            for (const user of allUsers) {
                if (user.id !== id && user.ativo) {
                    await this.usuarioCigamRepository.alterAtivo(user.id, false);
                }
            }
        }

        await this.usuarioCigamRepository.update(id, data);
        logger.finish('Usuario Cigam Updated')
        return
    }

    async delete(id: string): Promise<void>{
        logger.info(`Deleting Usuario Cigam with ID: ${id}`)
        const usuarioExistente = await this.usuarioCigamRepository.findById(id)
        if(!usuarioExistente){
            logger.error('Usuario Cigam Not Found')
            throw new NotFoundError(`Usuario Cigam with ID: ${id} not found`)
        }
        await this.usuarioCigamRepository.delete(id)
        logger.finish('Usuario Cigam deleted successfully')
        return
    }

    async alterAtivo(id: string): Promise<void>{
        logger.info('Starting update Active...')
        const usuarioExistente = await this.usuarioCigamRepository.findById(id)
        if(!usuarioExistente){
            logger.error('Usuario Cigam Not Found')
            throw new NotFoundError(`Usuario Cigam with ID: ${id} not found`)
        }
        const novoStatusAtivo = !usuarioExistente.ativo
        
        if (novoStatusAtivo) {
            const allUsers = await this.usuarioCigamRepository.findAll();
            for (const user of allUsers) {
                if (user.id !== id && user.ativo) {
                    await this.usuarioCigamRepository.alterAtivo(user.id, false);
                }
            }
        }
        
        await this.usuarioCigamRepository.alterAtivo(id, novoStatusAtivo)
        logger.finish('Usuario Cigam active altered')
        return
    }
    
}