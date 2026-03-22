export interface InstagramShortLivedTokenResponse {
  access_token: string;
  user_id: string;
}

export interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface InstagramProfile {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
}

export interface InstagramOAuthResult {
  customToken: string;
  uid: string;
}
