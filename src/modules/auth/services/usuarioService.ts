import { injectable, inject } from 'tsyringe';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioRepository } from '../repositories/usuarioRepository';
import { CreateUsuarioDTO, ResponseUsuarioDTO } from '../dto';
import { RegisterInput, LoginInput } from '../usuario.validator';
import { IntegrationError, UnauthorizedError, ConflictError, NotFoundError } from '@/shared/errors/AppError';

@injectable()
export class UsuarioService {
    constructor(
        @inject(UsuarioRepository) private readonly usuarioRepository: UsuarioRepository
    ) {}

    async register(data: RegisterInput): Promise<ResponseUsuarioDTO> {
        const existing = await this.usuarioRepository.findByEmail(data.email);
        if (existing) {
            throw new ConflictError('Já existe um usuário com este email.');
        }

        const hash = await bcrypt.hash(data.senha, 10);
        return this.usuarioRepository.create({
            nome: data.nome,
            email: data.email,
            senha: hash,
            role: data.role,
        });
    }

    async login(data: LoginInput): Promise<{ token: string; user: ResponseUsuarioDTO }> {
        const user = await this.usuarioRepository.findByEmail(data.email);
        if (!user) {
            throw new UnauthorizedError('Email ou senha inválidos.');
        }

        if (!user.ativo) {
            throw new UnauthorizedError('Usuário desativado.');
        }

        const valid = await bcrypt.compare(data.senha, user.senha);
        if (!valid) {
            throw new UnauthorizedError('Email ou senha inválidos.');
        }

        const secret = process.env.JWT_SECRET || 'chocmaster-jwt-secret';
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            secret,
            { expiresIn: '24h' }
        );

        const { senha: _, ...userWithoutPassword } = user;
        return { token, user: userWithoutPassword };
    }

    async findById(id: string): Promise<ResponseUsuarioDTO> {
        const user = await this.usuarioRepository.findById(id);
        if (!user) {
            throw new IntegrationError('Usuário não encontrado.');
        }
        return user;
    }

    async listAll(): Promise<ResponseUsuarioDTO[]> {
        return this.usuarioRepository.findAll();
    }

    async toggleAtivo(id: string): Promise<ResponseUsuarioDTO> {
        const usuario = await this.usuarioRepository.findById(id);
        if (!usuario) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        const novoStatusAtivo = !usuario.ativo;
        await this.usuarioRepository.updateAtivo(id, novoStatusAtivo);

        return { ...usuario, ativo: novoStatusAtivo };
    }
}
