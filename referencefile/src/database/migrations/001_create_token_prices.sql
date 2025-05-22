CREATE TABLE IF NOT EXISTS token_prices (
    id SERIAL PRIMARY KEY,
    mint_address VARCHAR(44) NOT NULL,
    price DECIMAL(24, 8) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) NOT NULL,
    UNIQUE(mint_address, timestamp)
);

CREATE INDEX idx_token_prices_mint_timestamp ON token_prices(mint_address, timestamp); 