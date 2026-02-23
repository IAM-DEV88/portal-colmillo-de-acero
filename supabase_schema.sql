
-- Tabla para códigos de redención de turnos
CREATE TABLE redemption_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    credits INTEGER NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    purchase_id VARCHAR(100), -- ID de transacción de PayPal o referencia manual
    notes TEXT
);

-- Índices para búsqueda rápida
CREATE INDEX idx_redemption_codes_code ON redemption_codes(code);
CREATE INDEX idx_redemption_codes_is_used ON redemption_codes(is_used);

-- Ejemplo de inserción de un código (esto se haría desde el backend al confirmar compra)
-- INSERT INTO redemption_codes (code, credits, purchase_id) VALUES ('TURNOS-12345', 50, 'PAYPAL-ID-HERE');
