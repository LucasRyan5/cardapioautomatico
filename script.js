document.addEventListener('DOMContentLoaded', () => {
    const cookieConsent = document.querySelector('.cookie-consent');
    const cookieConsentStorageKey = 'sabor-arte-cookie-consent';

    try {
        const savedConsent = window.localStorage.getItem(cookieConsentStorageKey);
        if (savedConsent !== 'accepted' && savedConsent !== 'rejected') {
            cookieConsent.showModal();
        }
    } catch (error) {
        console.error('Não foi possível ler a preferência de cookies salva.', error);
        cookieConsent.showModal();
    }

    cookieConsent.addEventListener('close', () => {
        const choice = cookieConsent.returnValue;
        if (choice !== 'accepted' && choice !== 'rejected') return;

        try {
            window.localStorage.setItem(cookieConsentStorageKey, choice);
        } catch (error) {
            console.error('Não foi possível salvar a preferência de cookies.', error);
        }
    });

    const filterButtons = document.querySelectorAll('.filter-btn');
    const menuItems = document.querySelectorAll('.menu-item');
    const carousel = document.querySelector('.menu-highlight');

    if (carousel) {
        const carouselImage = carousel.querySelector('.carousel-image');
        const carouselCaption = carousel.querySelector('.carousel-caption');
        const indicators = Array.from(carousel.querySelectorAll('.carousel-indicator'));
        const slides = [
            {
                src: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1400&q=85',
                alt: 'Prato de massa preparado com ingredientes frescos',
                caption: 'Sabores especiais, feitos com ingredientes frescos'
            },
            {
                src: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85',
                alt: 'Salada colorida com vegetais frescos',
                caption: 'Ingredientes frescos em cada detalhe'
            },
            {
                src: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1400&q=85',
                alt: 'Bolo de chocolate servido como sobremesa',
                caption: 'Um toque doce para finalizar'
            }
        ];
        let currentSlide = 0;
        let autoplayTimer;

        const replaySlideAnimation = (element) => {
            element.classList.remove('slide-change');
            void element.offsetWidth;
            element.classList.add('slide-change');
        };

        const showSlide = (index) => {
            currentSlide = (index + slides.length) % slides.length;
            const slide = slides[currentSlide];

            carouselImage.src = slide.src;
            carouselImage.alt = slide.alt;
            carouselCaption.textContent = slide.caption;
            replaySlideAnimation(carouselImage);
            replaySlideAnimation(carouselCaption);

            indicators.forEach((indicator, indicatorIndex) => {
                const isActive = indicatorIndex === currentSlide;
                indicator.classList.toggle('active', isActive);

                if (isActive) {
                    indicator.setAttribute('aria-current', 'true');
                } else {
                    indicator.removeAttribute('aria-current');
                }
            });
        };

        const stopAutoplay = () => window.clearInterval(autoplayTimer);
        const startAutoplay = () => {
            stopAutoplay();
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                autoplayTimer = window.setInterval(() => showSlide(currentSlide + 1), 5000);
            }
        };

        carousel.querySelector('.carousel-previous').addEventListener('click', () => {
            showSlide(currentSlide - 1);
            startAutoplay();
        });
        carousel.querySelector('.carousel-next').addEventListener('click', () => {
            showSlide(currentSlide + 1);
            startAutoplay();
        });
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                showSlide(index);
                startAutoplay();
            });
        });
        startAutoplay();
    }

    const animateCascade = (elements) => {
        elements.forEach(element => element.classList.remove('cascade-in'));

        if (elements.length === 0) return;

        // Reinicia a animação antes de aplicá-la novamente.
        elements[0].offsetWidth;

        elements.forEach((element, index) => {
            element.style.setProperty('--cascade-index', index);
            element.classList.add('cascade-in');
        });
    };

    const openingElements = [
        document.querySelector('header'),
        document.querySelector('.menu-highlight'),
        document.querySelector('.menu-filters'),
        ...menuItems,
        document.querySelector('footer')
    ].filter(Boolean);

    animateCascade(openingElements);

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe active de todos os botões e adiciona no clicado
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');
            const visibleItems = [];

            menuItems.forEach(item => {
                const category = item.getAttribute('data-category');

                if (filterValue === 'all' || category === filterValue) {
                    item.classList.remove('hide');
                    visibleItems.push(item);
                } else {
                    item.classList.add('hide');
                }
            });

            animateCascade(visibleItems);
        });
    });

    const restaurantWhatsApp = '5521965693094';
    const cart = new Map();
    const currencyFormatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    const chatbotPanel = document.querySelector('#chatbot-panel');
    const chatbotToggle = document.querySelector('.chatbot-toggle');
    const chatbotClose = document.querySelector('.chatbot-close');
    const chatbotForm = document.querySelector('.chatbot-form');
    const chatbotInput = document.querySelector('#chatbot-input');
    const chatbotMessages = document.querySelector('.chatbot-messages');
    let checkoutStep = null;
    const pendingOrder = {
        customerName: '',
        orderType: '',
        address: '',
        notes: ''
    };

    const setChatbotOpen = (isOpen, focusInput = true) => {
        chatbotPanel.hidden = !isOpen;
        chatbotToggle.setAttribute('aria-expanded', String(isOpen));

        if (isOpen && focusInput) chatbotInput.focus();
    };

    setChatbotOpen(true, false);

    const addChatMessage = (message, sender) => {
        const messageElement = document.createElement('p');
        messageElement.className = `chat-message ${sender}-message`;
        messageElement.textContent = message;
        chatbotMessages.append(messageElement);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    };

    const normalizeText = (text) => text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const getDishes = () => Array.from(menuItems).map(item => ({
            name: item.querySelector('.item-name').textContent.trim(),
            description: item.querySelector('.item-desc').textContent.trim(),
            price: Number(item.querySelector('.item-price').textContent.replace(/[^\d,]/g, '').replace(',', '.')),
            category: item.dataset.category
        }));

    const formatCart = () => {
        if (cart.size === 0) return 'Seu pedido está vazio.';

        const lines = Array.from(cart.values()).map(item =>
            `${item.quantity}x ${item.name} — ${currencyFormatter.format(item.price * item.quantity)}`
        );
        const total = Array.from(cart.values()).reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        return `Seu pedido:\n${lines.join('\n')}\nTotal: ${currencyFormatter.format(total)}.`;
    };

    const findDish = (normalizedQuestion) => {
        const dishes = getDishes();
        const exactMatch = dishes.find(dish =>
            normalizedQuestion.includes(normalizeText(dish.name))
        );
        if (exactMatch) return exactMatch;

        return dishes
            .map(dish => ({
                dish,
                matches: normalizeText(dish.name)
                    .split(/\s+/)
                    .filter(word => word.length > 3 && normalizedQuestion.includes(word)).length
            }))
            .filter(result => result.matches > 0)
            .sort((first, second) => second.matches - first.matches)[0]?.dish;
    };

    const addDishToCart = (dish, quantity = 1) => {
        const currentItem = cart.get(dish.name);
        cart.set(dish.name, {
            name: dish.name,
            price: dish.price,
            quantity: (currentItem ? currentItem.quantity : 0) + quantity
        });
    };

    const makeWhatsAppUrl = () => {
        const orderLines = Array.from(cart.values()).map(item =>
            `- ${item.quantity}x ${item.name} — ${currencyFormatter.format(item.price * item.quantity)}`
        );
        const total = Array.from(cart.values()).reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        const message = [
            'Olá! Gostaria de fazer este pedido:',
            '',
            ...orderLines,
            '',
            `Total: ${currencyFormatter.format(total)}`,
            `Recebimento: ${pendingOrder.orderType === 'entrega' ? 'Entrega' : 'Retirada no local'}`,
            ...(pendingOrder.orderType === 'entrega' ? [`Endereço: ${pendingOrder.address}`] : []),
            `Nome: ${pendingOrder.customerName}`,
            ...(pendingOrder.notes ? [`Observações: ${pendingOrder.notes}`] : [])
        ].join('\n');

        return `https://wa.me/${restaurantWhatsApp}?text=${encodeURIComponent(message)}`;
    };

    const startCheckout = () => {
        if (cart.size === 0) return 'Seu pedido está vazio. Diga o nome de um prato para adicioná-lo.';

        checkoutStep = 'name';
        return `${formatCart()}\n\nVamos finalizar! Qual é o seu nome?`;
    };

    const showCheckoutSummary = () => {
        checkoutStep = 'confirmation';
        return `${formatCart()}\nRecebimento: ${pendingOrder.orderType === 'entrega' ? `Entrega — ${pendingOrder.address}` : 'Retirada no local'}\nNome: ${pendingOrder.customerName}${pendingOrder.notes ? `\nObservações: ${pendingOrder.notes}` : ''}\n\nEstá tudo certo? Responda “sim” para abrir o WhatsApp ou “não” para cancelar.`;
    };

    const handleCheckoutReply = (question, normalizedQuestion) => {
        if (/\b(cancelar|cancela|desistir|desisto)\b/.test(normalizedQuestion)) {
            checkoutStep = null;
            return 'Tudo bem, a finalização foi cancelada. Seu carrinho continua salvo. Quando quiser, diga “finalizar pedido”.';
        }

        if (checkoutStep === 'name') {
            const customerName = question.trim().replace(/^(meu nome (?:e|é)|sou|aqui (?:e|é))\s+/i, '');
            if (customerName.length < 2) return 'Não consegui identificar seu nome. Pode informar novamente?';
            pendingOrder.customerName = customerName;
            checkoutStep = 'orderType';
            return 'Você prefere entrega ou retirada no local?';
        }

        if (checkoutStep === 'orderType') {
            if (/\b(entrega|entregar|delivery)\b/.test(normalizedQuestion)) {
                pendingOrder.orderType = 'entrega';
                checkoutStep = 'address';
                return 'Qual é o endereço completo para entrega?';
            }
            if (/\b(retirada|retirar|buscar|local)\b/.test(normalizedQuestion)) {
                pendingOrder.orderType = 'retirada';
                checkoutStep = 'notes';
                return 'Quer incluir alguma observação no pedido? Se não, responda “não”.';
            }
            return 'Por favor, escolha uma opção: entrega ou retirada no local.';
        }

        if (checkoutStep === 'address') {
            if (question.trim().length < 5) return 'Informe o endereço completo para a entrega, por favor.';
            pendingOrder.address = question.trim();
            checkoutStep = 'notes';
            return 'Quer incluir alguma observação no pedido? Se não, responda “não”.';
        }

        if (checkoutStep === 'notes') {
            pendingOrder.notes = /\b(nao|não|nenhuma|sem observacao|sem observacoes|pular)\b/.test(normalizedQuestion)
                ? ''
                : question.trim();
            return showCheckoutSummary();
        }

        if (checkoutStep === 'confirmation') {
            if (/\b(sim|confirmo|confirmar|pode enviar)\b/.test(normalizedQuestion)) {
                if (cart.size === 0) {
                    checkoutStep = null;
                    return 'Seu carrinho está vazio; adicione um prato antes de finalizar.';
                }

                const whatsappUrl = makeWhatsAppUrl();
                checkoutStep = null;
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                return 'Abri o WhatsApp com o resumo do pedido. Confira e toque em enviar para confirmar com o restaurante.';
            }
            if (/\b(nao|cancelar|cancela)\b/.test(normalizedQuestion)) {
                checkoutStep = null;
                return 'Pedido não enviado. Seu carrinho continua salvo; você pode alterar os itens e finalizar novamente.';
            }
            return 'Responda “sim” para abrir o WhatsApp com o pedido ou “não” para cancelar.';
        }

        return '';
    };

    const getChatbotReply = (question) => {
        const normalizedQuestion = normalizeText(question);

        if (checkoutStep) return handleCheckoutReply(question, normalizedQuestion);

        if (/\b(ajuda|opcoes|como funciona)\b/.test(normalizedQuestion)) {
            return 'Posso mostrar entradas, pratos principais, sobremesas e preços. Para pedir, diga “quero 2 Bruschetta Tradicional”; para ver o carrinho, diga “meu pedido”; para finalizar, diga “finalizar pedido”. Também pode remover itens ou dizer “cancelar”.';
        }

        if (/\b(cardapio|cardapio completo)\b/.test(normalizedQuestion)) {
            return `Nosso cardápio: ${getDishes().map(dish => `${dish.name} (${currencyFormatter.format(dish.price)})`).join('; ')}. Para adicionar, diga “quero” e o nome do prato.`;
        }

        if (/\b(finalizar|finaliza|fechar pedido|concluir pedido|checkout)\b/.test(normalizedQuestion)) {
            return startCheckout();
        }

        if (/\b(limpar carrinho|esvaziar carrinho|apagar pedido)\b/.test(normalizedQuestion)) {
            cart.clear();
            return 'Carrinho limpo. Quando quiser, peça qualquer prato pelo nome.';
        }

        if (/\b(meu pedido|meu carrinho|ver carrinho|mostrar carrinho|mostrar pedido|resumo do pedido)\b/.test(normalizedQuestion)) {
            return formatCart();
        }

        const dishes = getDishes();
        const matchingDish = findDish(normalizedQuestion);

        if (matchingDish && /\b(remover|remove|tirar|retirar|excluir)\b/.test(normalizedQuestion)) {
            const item = cart.get(matchingDish.name);
            if (!item) return `${matchingDish.name} ainda não está no seu pedido.`;
            cart.delete(matchingDish.name);
            return `${matchingDish.name} foi removido. ${formatCart()}`;
        }

        if (matchingDish && /\b(diminuir|diminui|menos|reduzir|reduz)\b/.test(normalizedQuestion)) {
            const item = cart.get(matchingDish.name);
            if (!item) return `${matchingDish.name} ainda não está no seu pedido.`;
            item.quantity -= 1;
            if (item.quantity <= 0) cart.delete(matchingDish.name);
            return `Atualizei a quantidade de ${matchingDish.name}. ${formatCart()}`;
        }

        const isDishRequest = /\b(adicionar|adiciona|adicione|quero|pedir|peco|coloca|coloque|incluir|inclua)\b/.test(normalizedQuestion);
        const isAskingForInformation = /\b(saber|informacao|descricao|ingrediente|ingredientes)\b/.test(normalizedQuestion);
        if (matchingDish && (/\b(aumentar|aumenta|mais)\b/.test(normalizedQuestion) || (isDishRequest && !isAskingForInformation))) {
            const quantityMatch = normalizedQuestion.match(/\b(\d+)\b/);
            const quantityWords = {
                um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5
            };
            const wordQuantity = Object.entries(quantityWords).find(([word]) =>
                new RegExp(`\\b${word}\\b`).test(normalizedQuestion)
            );
            const quantity = Math.min(
                Math.max(1, quantityMatch ? Number(quantityMatch[1]) : wordQuantity ? wordQuantity[1] : 1),
                99
            );

            addDishToCart(matchingDish, quantity);
            return `Adicionei ${quantity}x ${matchingDish.name} ao seu pedido. ${formatCart()}\n\nPode pedir outro prato ou dizer “finalizar pedido”.`;
        }

        if (matchingDish) {
            return `${matchingDish.name}: ${matchingDish.description} Preço: ${currencyFormatter.format(matchingDish.price)}. Para adicionar, diga “quero ${matchingDish.name}”.`;
        }

        if (/\b(entrada|entradas)\b/.test(normalizedQuestion)) {
            return `Temos estas entradas: ${dishes.filter(dish => dish.category === 'entradas').map(dish => `${dish.name} (${currencyFormatter.format(dish.price)})`).join(' e ')}. Diga “quero” e o nome para adicionar.`;
        }

        if (/\b(prato|pratos|principal|principais)\b/.test(normalizedQuestion)) {
            return `Nossos pratos principais são: ${dishes.filter(dish => dish.category === 'principais').map(dish => `${dish.name} (${currencyFormatter.format(dish.price)})`).join(' e ')}. Diga “quero” e o nome para adicionar.`;
        }

        if (/\b(sobremesa|sobremesas|doce|doces)\b/.test(normalizedQuestion)) {
            return `Para sobremesa, temos: ${dishes.filter(dish => dish.category === 'sobremesas').map(dish => `${dish.name} (${currencyFormatter.format(dish.price)})`).join(' e ')}. Diga “quero” e o nome para adicionar.`;
        }

        if (/\b(preco|precos|valor|valores|quanto custa)\b/.test(normalizedQuestion)) {
            return `Confira os preços: ${dishes.map(dish => `${dish.name}: ${currencyFormatter.format(dish.price)}`).join('; ')}.`;
        }

        if (/\b(oi|ola|bom dia|boa tarde|boa noite)\b/.test(normalizedQuestion)) {
            return 'Olá! Posso mostrar o cardápio, adicionar pratos ao pedido, consultar o carrinho e finalizar pelo WhatsApp. O que deseja fazer?';
        }

        return 'Não entendi esse pedido. Digite “ajuda” para ver o que posso fazer, ou pergunte por entradas, pratos, sobremesas e preços.';
    };

    chatbotToggle.addEventListener('click', () => {
        setChatbotOpen(chatbotPanel.hidden);
    });

    chatbotClose.addEventListener('click', () => {
        setChatbotOpen(false);
        chatbotToggle.focus();
    });

    chatbotForm.addEventListener('submit', event => {
        event.preventDefault();
        const question = chatbotInput.value.trim();

        if (!question) return;

        addChatMessage(question, 'user');
        addChatMessage(getChatbotReply(question), 'bot');
        chatbotForm.reset();
        chatbotInput.focus();
    });
});
