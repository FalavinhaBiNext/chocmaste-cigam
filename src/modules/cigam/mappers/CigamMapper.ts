import { ResponseCigamTokenDTO } from "../dto";

export class CigamMapper {
  static tokenToDTO(model: any): ResponseCigamTokenDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      hash: data.hash,
      ambiente: data.ambiente,
      expires_at: data.expires_at,
      active: data.active,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }
}