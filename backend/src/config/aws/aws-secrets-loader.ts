import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export const loadAwsSecrets = async (): Promise<Record<string, string>> => {
  const secretId = process.env.AWS_SECRET_ID;
  const region = process.env.AWS_REGION;

  // if (!secretId || !region) {
  //   console.warn('AWS secrets not loaded — AWS_SECRET_ID or AWS_REGION missing.');
  //   return {};
  // }

  try {
    const client = new SecretsManagerClient({ region });
    const command = new GetSecretValueCommand({ SecretId: secretId });

    const response = await client.send(command);

    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }

    return {};
  } catch (err) {
    console.error('Failed to load AWS Secrets:', err);
    return {};
  }
};
