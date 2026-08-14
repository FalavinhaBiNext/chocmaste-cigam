import { ResponseBlingTokenDTO } from "../dto";

export class BlingMapper {
  static tokenToDTO(model: any): ResponseBlingTokenDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      scope: data.scope,
      token_type: data.token_type,
      access_token_url: data.access_token_url,
      client_id: data.client_id,
      client_secret: data.client_secret,
      active: data.active,
      nome_unidade: data.nome_unidade,
      company_id_bling: data.company_id_bling,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }
}
