# Generate a pem pub/priv key
openssl genpkey -algorithm RSA -out rsa_private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in rsa_private.pem -pubout -out rsa_public.pem

# Ensure the service account key is read
export GOOGLE_APPLICATION_CREDENTIALS="/Users/ajav/OneDriveSync/OneDrive/101.IoT/iot-playground/key.json"