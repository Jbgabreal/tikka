# Changelog

## [Unreleased]

### Added
- Token symbol to address mapping using `@solana/spl-token-registry`
- Support for price queries using token symbols (e.g., "What is the price of BONK?")
- Pre-populated map of popular tokens for reliable lookups
- Enhanced message intent detection for DeFi queries
- Unified token price service with Raydium API fallback
- Raydium price API integration for reliable price data
- Interactive token price checker CLI tool

### Changed
- Improved chat service to handle token price queries in multiple formats
- Updated PumpPortal API integration to use correct query parameters
- Structured response generation for different types of DeFi queries
- Server initialization now includes token services setup

### Fixed
- Fixed API endpoint format for PumpPortal price queries
- Implemented fallback mechanism for token price lookups when PumpPortal fails
- Added proper error handling for price query failures 