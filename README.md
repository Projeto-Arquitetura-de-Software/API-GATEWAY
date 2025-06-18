# API Gateway & Balanceador de Carga

Este serviço atua como o Ponto Único de Entrada (`Single Point of Entry`) para toda a arquitetura. Ele é responsável por receber as requisições dos clientes, roteá-las para os serviços de backend apropriados e distribuir a carga entre as instâncias disponíveis.

## Funcionalidades Principais

* **Roteamento Baseado em Rota:** Encaminha todas as requisições que começam com o prefixo `/api/products` para os servidores de backend.
* **Balanceamento de Carga:** Distribui as requisições entre os servidores de backend disponíveis (original e réplica) utilizando o algoritmo Round Robin.

## Desenvolvidor por
* Jõao Paulo Paixão
* Gabriel Henrique
* Victor de Mesquita
