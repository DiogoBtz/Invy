// Comportamentos globais: toasts, confirmacoes e animacao leve de entrada.
(function () {
    function closeToast(toast) {
        if (!toast) {
            return;
        }
        toast.classList.add("is-hiding");
        window.setTimeout(() => toast.remove(), 220);
    }

    function showToast(message, category = "success") {
        let stack = document.querySelector(".toast-stack");
        if (!stack) {
            stack = document.createElement("div");
            stack.className = "toast-stack";
            stack.setAttribute("aria-live", "polite");
            stack.setAttribute("aria-atomic", "true");
            document.body.prepend(stack);
        }

        const toast = document.createElement("div");
        toast.className = `toast-message toast-${category}`;
        toast.setAttribute("role", "status");
        toast.innerHTML = `
            <div class="toast-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"></path></svg>
            </div>
            <div class="toast-body">
                <strong>${category === "success" ? "Tudo certo" : "Aviso"}</strong>
                <span></span>
            </div>
            <button type="button" class="toast-close" aria-label="Fechar aviso">×</button>
            <div class="toast-progress" aria-hidden="true"></div>
        `;
        toast.querySelector(".toast-body span").textContent = message;
        toast.querySelector(".toast-close").addEventListener("click", () => closeToast(toast));
        stack.appendChild(toast);
        window.setTimeout(() => closeToast(toast), 5200);
    }

    document.querySelectorAll(".toast-close").forEach((button) => {
        button.addEventListener("click", () => closeToast(button.closest(".toast-message")));
    });

    window.setTimeout(() => {
        document.querySelectorAll(".toast-message").forEach(closeToast);
    }, 5200);

    function cookieValue(name) {
        return document.cookie
            .split(";")
            .map((part) => part.trim())
            .find((part) => part.startsWith(`${name}=`))
            ?.split("=")
            .slice(1)
            .join("=") || "";
    }

    function clearCookie(name) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }

    document.querySelectorAll("[data-export-download]").forEach((link) => {
        link.addEventListener("click", () => {
            const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const url = new URL(link.href, window.location.href);
            url.searchParams.set("download_token", token);
            link.href = url.toString();

            showToast("Gerando exportacao...", "warning");

            const startedAt = Date.now();
            const timer = window.setInterval(() => {
                if (cookieValue("invy_download_token") === token) {
                    window.clearInterval(timer);
                    clearCookie("invy_download_token");
                    showToast("Exportacao concluida. Confira o arquivo na pasta de downloads.", "success");
                    return;
                }

                if (Date.now() - startedAt > 20000) {
                    window.clearInterval(timer);
                    showToast("Se o download nao apareceu, confira os avisos da tela e tente novamente.", "warning");
                }
            }, 500);
        });
    });

    document.querySelectorAll("[data-auto-submit]").forEach((form) => {
        const controls = form.querySelectorAll("[data-auto-submit-control]");
        controls.forEach((control) => {
            control.addEventListener("change", () => {
                if (form.requestSubmit) {
                    form.requestSubmit();
                    return;
                }
                form.submit();
            });
        });
    });

    document.querySelectorAll("[data-m365-shared-input]").forEach((field) => {
        const syncSharedValue = () => {
            const key = field.dataset.m365SharedKey;
            if (!key) {
                return;
            }
            const scope = field.form || document;
            scope.querySelectorAll("[data-m365-shared-input]").forEach((other) => {
                if (other !== field && other.dataset.m365SharedKey === key) {
                    other.value = field.value;
                }
            });
        };

        field.addEventListener("input", syncSharedValue);
        field.addEventListener("change", syncSharedValue);
    });

    document.querySelectorAll("[data-m365-gap-filter]").forEach((input) => {
        const table = document.querySelector(input.dataset.m365GapFilter || "");
        const rows = Array.from(table?.querySelectorAll("[data-m365-gap-row]") || []);
        const count = input.closest(".panel")?.querySelector("[data-m365-gap-count-visible]");
        const normalize = (value) => String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        const applyFilter = () => {
            const term = normalize(input.value);
            let visible = 0;
            rows.forEach((row) => {
                const match = !term || normalize(row.textContent).includes(term);
                row.hidden = !match;
                if (match) {
                    visible += 1;
                }
            });
            if (count) {
                count.textContent = visible;
            }
        };

        input.addEventListener("input", applyFilter);
        applyFilter();
    });

    document.querySelectorAll("[data-collaborator-allocation-form]").forEach((form) => {
        const rowsWrap = form.querySelector("[data-allocation-rows]");
        const addButton = form.querySelector("[data-add-allocation-row]");
        const firstRow = form.querySelector("[data-allocation-row]");
        if (!rowsWrap || !addButton || !firstRow) {
            return;
        }

        addButton.addEventListener("click", () => {
            const newRow = firstRow.cloneNode(true);
            newRow.querySelectorAll("select, input, textarea").forEach((field) => {
                if (field.tagName === "SELECT") {
                    field.selectedIndex = 0;
                    return;
                }
                if (field.type === "number") {
                    field.value = "1";
                    return;
                }
                field.value = "";
            });
            newRow.classList.add("section-spacer");
            rowsWrap.appendChild(newRow);
        });
    });

    document.querySelectorAll("[data-bulk-item-rows]").forEach((rowsWrap) => {
        const invoiceRow = rowsWrap.closest(".bulk-invoice-row");
        const addButton = invoiceRow?.querySelector("[data-add-bulk-item-row]");
        const firstRow = rowsWrap.querySelector("[data-bulk-item-row]");
        if (!addButton || !firstRow) {
            return;
        }

        const clearFields = (row) => {
            row.querySelectorAll("input, textarea").forEach((field) => {
                if (field.type === "number") {
                    field.value = "1";
                    return;
                }
                field.value = "";
            });
        };

        const syncRemoveButtons = () => {
            const rows = rowsWrap.querySelectorAll("[data-bulk-item-row]");
            rows.forEach((row) => {
                const button = row.querySelector("[data-remove-bulk-item-row]");
                if (button) {
                    button.disabled = false;
                    button.textContent = rows.length <= 1 ? "Limpar linha" : "Remover linha";
                }
            });
        };

        addButton.addEventListener("click", () => {
            const newRow = firstRow.cloneNode(true);
            clearFields(newRow);
            rowsWrap.appendChild(newRow);
            syncRemoveButtons();
        });

        rowsWrap.addEventListener("click", (event) => {
            const removeButton = event.target.closest("[data-remove-bulk-item-row]");
            if (!removeButton) {
                return;
            }

            const rows = rowsWrap.querySelectorAll("[data-bulk-item-row]");
            const row = removeButton.closest("[data-bulk-item-row]");
            if (!row) {
                return;
            }

            if (rows.length <= 1) {
                clearFields(row);
                syncRemoveButtons();
                return;
            }

            row.remove();
            syncRemoveButtons();
        });

        syncRemoveButtons();
    });

    document.querySelectorAll("[data-bulk-invoice-upload]").forEach((form) => {
        const modes = Array.from(form.querySelectorAll("[data-bulk-upload-mode]"));
        const panes = Array.from(form.querySelectorAll("[data-bulk-upload-pane]"));
        const fileInputs = Array.from(form.querySelectorAll("[data-bulk-upload-input]"));
        const summary = form.querySelector("[data-bulk-upload-summary]");
        const submitButton = form.querySelector("[data-bulk-upload-submit]");

        if (!modes.length || !panes.length || !summary) {
            return;
        }

        const isPdf = (file) => {
            const name = String(file?.name || "").toLowerCase();
            return name.endsWith(".pdf") || file?.type === "application/pdf";
        };

        const activeMode = () => modes.find((mode) => mode.checked)?.value || "files";

        const activeInput = () => {
            const pane = panes.find((item) => item.dataset.bulkUploadPane === activeMode());
            return pane?.querySelector("[data-bulk-upload-input]") || null;
        };

        const selectedFiles = () => Array.from(activeInput()?.files || []);

        const folderName = (files) => {
            const relativePath = files.find((file) => file.webkitRelativePath)?.webkitRelativePath || "";
            return relativePath.includes("/") ? relativePath.split("/")[0] : "";
        };

        const renderSummary = () => {
            const files = selectedFiles();
            const pdfs = files.filter(isPdf);
            const ignored = files.length - pdfs.length;
            const mode = activeMode();
            const fragment = document.createDocumentFragment();

            const title = document.createElement("strong");
            title.textContent = pdfs.length
                ? `${pdfs.length} PDF(s) selecionado(s)`
                : "Nenhum PDF selecionado";
            fragment.appendChild(title);

            const detail = document.createElement("small");
            if (!files.length) {
                detail.textContent = mode === "folder"
                    ? "Selecione uma pasta com DANFEs/PDFs."
                    : "Selecione um PDF ou varios PDFs individuais.";
            } else {
                const parts = [];
                const folder = folderName(files);
                if (folder) {
                    parts.push(`Pasta: ${folder}`);
                }
                if (ignored) {
                    parts.push(`${ignored} arquivo(s) sem PDF serao ignorados`);
                }
                detail.textContent = parts.join(" | ") || "Pronto para analisar.";
            }
            fragment.appendChild(detail);

            if (pdfs.length) {
                const list = document.createElement("div");
                list.className = "invoice-upload-summary-list";
                pdfs.slice(0, 4).forEach((file) => {
                    const item = document.createElement("span");
                    item.textContent = file.webkitRelativePath || file.name;
                    list.appendChild(item);
                });
                if (pdfs.length > 4) {
                    const rest = document.createElement("span");
                    rest.textContent = `+ ${pdfs.length - 4} outro(s) PDF(s)`;
                    list.appendChild(rest);
                }
                fragment.appendChild(list);
            }

            summary.replaceChildren(fragment);
            if (submitButton) {
                submitButton.disabled = pdfs.length < 1;
            }
        };

        const syncMode = () => {
            const mode = activeMode();
            modes.forEach((input) => {
                input.closest(".invoice-import-mode-option")?.classList.toggle("is-active", input.checked);
            });
            panes.forEach((pane) => {
                const active = pane.dataset.bulkUploadPane === mode;
                pane.hidden = !active;
                pane.classList.toggle("is-active", active);
                pane.querySelectorAll("[data-bulk-upload-input]").forEach((input) => {
                    input.disabled = !active;
                    input.required = active;
                    if (!active) {
                        input.value = "";
                    }
                });
            });
            renderSummary();
        };

        modes.forEach((mode) => {
            mode.addEventListener("change", syncMode);
        });
        fileInputs.forEach((input) => {
            input.addEventListener("change", renderSummary);
        });
        form.addEventListener("submit", (event) => {
            if (selectedFiles().filter(isPdf).length) {
                return;
            }
            event.preventDefault();
            showToast("Selecione pelo menos um PDF/DANFE para analisar.", "error");
        });

        syncMode();
    });

    document.addEventListener("submit", (event) => {
        const submitter = event.submitter;
        const message = submitter?.dataset.confirm || event.target.dataset.confirm;
        if (message && !window.confirm(message)) {
            event.preventDefault();
            return;
        }

    });

    const equipmentForm = document.querySelector(".equipment-form");
    if (equipmentForm) {
        const typeSelect = equipmentForm.querySelector("[name='tipo_equipamento']");
        const statusSelect = equipmentForm.querySelector("[name='status_equipamento']");
        const itemModelLabel = equipmentForm.querySelector("[data-item-model-label]");

        if (typeSelect && itemModelLabel) {
            const accessoryTypes = new Set(["Dockstation", "Mouse", "Teclado", "Headset"]);
            const equipmentTypes = new Set(["Notebook", "Desktop", "Monitor", "Celular", "Impressora"]);

            const updateItemModelLabel = () => {
                const selectedType = typeSelect.value;

                if (accessoryTypes.has(selectedType)) {
                    itemModelLabel.textContent = "Nome / modelo do acessório cadastrado";
                    return;
                }

                if (equipmentTypes.has(selectedType)) {
                    itemModelLabel.textContent = "Modelo / nome do equipamento cadastrado";
                    return;
                }

                itemModelLabel.textContent = "Nome / modelo do item cadastrado";
            };

            typeSelect.addEventListener("change", updateItemModelLabel);
            updateItemModelLabel();
        }

        if (typeSelect) {
            const serviceTagRequiredTypes = new Set([]);
            const patrimonioRequiredTypes = new Set([]);
            const computerSpecTypes = new Set(["Notebook", "Desktop"]);
            const stockQuantityTypes = new Set(["Monitor", "Dockstation", "Mouse", "Teclado", "Headset", "Celular", "Impressora", "Outro"]);
            const repairServiceTypes = new Set(["Notebook", "Desktop"]);
            const computerSpecFields = [
                "windows_versao",
                "armazenamento_gb",
                "memoria_gb",
                "processador",
            ];
            const computerRequiredFields = new Set([
                "windows_versao",
                "armazenamento_gb",
                "memoria_gb",
                "processador",
            ]);

            const fieldWrapper = (field) => field?.closest("div");
            const setRequired = (field, required) => {
                if (!field) {
                    return;
                }
                field.required = required;
                const marker = fieldWrapper(field)?.querySelector(".required-marker");
                if (marker) {
                    marker.classList.toggle("is-hidden", !required);
                }
            };
            const setVisible = (field, visible) => {
                if (!field) {
                    return;
                }
                field.disabled = !visible;
                fieldWrapper(field)?.classList.toggle("is-hidden", !visible);
            };

            const updateEquipmentTypeFields = () => {
                const selectedType = typeSelect.value || "Notebook";
                const needsServiceTag = serviceTagRequiredTypes.has(selectedType);
                const needsPatrimonio = patrimonioRequiredTypes.has(selectedType);
                const needsSpecs = computerSpecTypes.has(selectedType);
                const controlsStockQuantity = stockQuantityTypes.has(selectedType);
                const acceptsService = repairServiceTypes.has(selectedType);
                const quantityField = equipmentForm.querySelector("[name='quantidade_estoque']");
                const powerAdapterSection = equipmentForm.querySelector("[data-power-adapter-section]");
                const serviceSection = equipmentForm.querySelector("[data-service-section]");

                setRequired(equipmentForm.querySelector("[name='patrimonio']"), needsPatrimonio);
                setRequired(equipmentForm.querySelector("[name='service_tag']"), needsServiceTag);
                setVisible(quantityField, controlsStockQuantity);
                setRequired(quantityField, controlsStockQuantity);
                powerAdapterSection?.classList.toggle("is-hidden", !needsSpecs);
                serviceSection?.classList.toggle("is-hidden", !acceptsService);
                serviceSection?.querySelectorAll("input, select, textarea").forEach((field) => {
                    field.disabled = !acceptsService;
                    if (!acceptsService) {
                        field.value = "";
                    }
                });
                if (!acceptsService && serviceSection) {
                    serviceSection.open = false;
                }

                computerSpecFields.forEach((name) => {
                    const field = equipmentForm.querySelector(`[name='${name}']`);
                    setVisible(field, needsSpecs);
                    setRequired(field, needsSpecs && computerRequiredFields.has(name));
                });
            };

            typeSelect.addEventListener("change", updateEquipmentTypeFields);
            updateEquipmentTypeFields();
        }

        const ownershipSection = equipmentForm.querySelector("[data-ownership-section]");
        const ownerFieldNames = [
            "colaborador_responsavel_id",
            "usuario_final",
            "email_colaborador",
            "empresa_colaborador",
            "cpf_colaborador",
            "setor_usuario",
            "departamento",
            "data_troca_dono",
        ];
        const ownershipFields = ownerFieldNames
            .map((name) => equipmentForm.querySelector(`[name='${name}']`))
            .filter(Boolean);

        const clearOwnerFields = () => {
            ownershipFields.forEach((field) => {
                field.value = "";
            });
        };

        const updateOwnershipFields = () => {
            if (!ownershipSection || !statusSelect) {
                return;
            }

            const inStock = statusSelect.value === "Estoque";
            ownershipSection.classList.toggle("is-hidden", inStock);
            ownershipSection.querySelectorAll("input, select, textarea").forEach((field) => {
                field.disabled = inStock;
            });

            if (inStock) {
                clearOwnerFields();
                ownershipSection.open = false;
            }
        };

        if (statusSelect) {
            statusSelect.addEventListener("change", updateOwnershipFields);
            updateOwnershipFields();
        }

        const linkedEquipmentInput = equipmentForm.querySelector("[data-linked-equipment-input]");
        const linkedEquipmentPresets = equipmentForm.querySelectorAll("[data-linked-equipment-preset]");

        if (linkedEquipmentInput && linkedEquipmentPresets.length) {
            const splitLinkedItems = (value) => (value || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

            linkedEquipmentPresets.forEach((button) => {
                button.addEventListener("click", () => {
                    const preset = button.dataset.linkedEquipmentPreset;
                    const items = splitLinkedItems(linkedEquipmentInput.value);
                    const exists = items.some((item) => item.toLowerCase() === preset.toLowerCase());

                    if (!exists) {
                        items.push(preset);
                    }

                    linkedEquipmentInput.value = items.join(", ");
                    linkedEquipmentInput.focus();
                });
            });
        }

        const collaboratorInput = equipmentForm.querySelector("[data-collaborator-name-input]");
        const collaboratorOptions = Array.from(document.querySelectorAll("#colaboradores-opcoes option"));
        if (collaboratorInput && collaboratorOptions.length) {
            const collaboratorIdField = equipmentForm.querySelector("[data-collaborator-id-input]");
            const syncWarning = equipmentForm.querySelector("[data-collaborator-sync-warning]");
            const syncWarningName = equipmentForm.querySelector("[data-collaborator-sync-name]");
            const syncWarningList = equipmentForm.querySelector("[data-collaborator-sync-list]");
            const emailField = equipmentForm.querySelector("[name='email_colaborador']");
            const cpfField = equipmentForm.querySelector("[name='cpf_colaborador']");
            const companyField = equipmentForm.querySelector("[name='empresa_colaborador']");
            const departmentField = equipmentForm.querySelector("[name='departamento']");
            const roleField = equipmentForm.querySelector("[name='setor_usuario']");
            const collaboratorTrackedFields = [
                collaboratorInput,
                emailField,
                cpfField,
                companyField,
                departmentField,
                roleField,
            ].filter(Boolean);
            let selectedCollaborator = null;

            const normalizeCollaboratorValue = (value) => (value || "")
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();
            const normalizeCollaboratorCpf = (value) => (value || "").replace(/\D/g, "");
            const optionPayload = (option) => ({
                id: option.dataset.id || "",
                nome: option.value || "",
                email: option.dataset.email || "",
                cpf: option.dataset.cpf || "",
                empresa: option.dataset.empresa || "",
                departamento: option.dataset.departamento || "",
                cargo: option.dataset.cargo || "",
            });
            const findOptionById = (id) => collaboratorOptions.find(
                (option) => option.dataset.id && option.dataset.id === String(id || "")
            );
            const findOptionByName = (name) => {
                const normalized = normalizeCollaboratorValue(name);
                if (!normalized) {
                    return null;
                }
                return collaboratorOptions.find(
                    (option) => normalizeCollaboratorValue(option.value) === normalized
                );
            };
            const findOptionByEmail = (email) => {
                const normalized = normalizeCollaboratorValue(email);
                if (!normalized) {
                    return null;
                }
                return collaboratorOptions.find(
                    (option) => normalizeCollaboratorValue(option.dataset.email) === normalized
                );
            };
            const findOptionByCpf = (cpf) => {
                const normalized = normalizeCollaboratorCpf(cpf);
                if (!normalized) {
                    return null;
                }
                return collaboratorOptions.find(
                    (option) => normalizeCollaboratorCpf(option.dataset.cpf) === normalized
                );
            };
            const findOptionFromFields = () => (
                findOptionById(collaboratorIdField?.value)
                || findOptionByName(collaboratorInput.value)
                || findOptionByEmail(emailField?.value)
                || findOptionByCpf(cpfField?.value)
            );
            const originalCollaboratorValues = new Map(
                collaboratorTrackedFields.map((field) => [field, field.defaultValue ?? field.value])
            );
            const collaboratorFieldsChanged = () => collaboratorTrackedFields.some((field) => {
                const normalizarCampo = field === cpfField ? normalizeCollaboratorCpf : normalizeCollaboratorValue;
                return normalizarCampo(field.value) !== normalizarCampo(originalCollaboratorValues.get(field));
            });

            const ensureInUseForCollaborator = () => {
                if (!statusSelect || !collaboratorInput.value.trim()) {
                    return;
                }
                if (statusSelect.value === "Estoque") {
                    statusSelect.value = "Em uso";
                    updateOwnershipFields();
                }
            };

            const setCollaboratorReference = (option) => {
                if (!option) {
                    return null;
                }
                selectedCollaborator = optionPayload(option);
                if (collaboratorIdField) {
                    collaboratorIdField.value = selectedCollaborator.id;
                }
                return selectedCollaborator;
            };

            const renderCollaboratorSyncWarning = () => {
                if (!syncWarning || !syncWarningList) {
                    return;
                }

                if (!selectedCollaborator || !collaboratorFieldsChanged()) {
                    syncWarning.hidden = true;
                    syncWarningList.replaceChildren();
                    return;
                }

                const campos = [
                    { label: "Nome", atual: collaboratorInput.value, cadastro: selectedCollaborator.nome },
                    { label: "E-mail", atual: emailField?.value, cadastro: selectedCollaborator.email },
                    {
                        label: "CPF",
                        atual: cpfField?.value,
                        cadastro: selectedCollaborator.cpf,
                        normalizar: normalizeCollaboratorCpf,
                    },
                    { label: "Empresa", atual: companyField?.value, cadastro: selectedCollaborator.empresa },
                    { label: "Departamento", atual: departmentField?.value, cadastro: selectedCollaborator.departamento },
                    { label: "Setor/Função", atual: roleField?.value, cadastro: selectedCollaborator.cargo },
                ];
                const divergencias = campos.filter((campo) => {
                    const normalizarCampo = campo.normalizar || normalizeCollaboratorValue;
                    return normalizarCampo(campo.atual) !== normalizarCampo(campo.cadastro);
                });

                syncWarning.hidden = divergencias.length === 0;
                if (syncWarningName) {
                    syncWarningName.textContent = selectedCollaborator.nome || "colaborador";
                }
                syncWarningList.replaceChildren();
                divergencias.forEach((campo) => {
                    const item = document.createElement("li");
                    const cadastro = campo.cadastro || "vazio";
                    const atual = campo.atual || "vazio";
                    item.textContent = `${campo.label}: cadastro "${cadastro}" -> equipamento "${atual}"`;
                    syncWarningList.appendChild(item);
                });
            };

            const applyCollaboratorData = (option) => {
                const selected = setCollaboratorReference(option);
                if (!selected) {
                    renderCollaboratorSyncWarning();
                    return;
                }

                if (collaboratorInput) {
                    collaboratorInput.value = selected.nome;
                }
                if (emailField) {
                    emailField.value = selected.email;
                }
                if (cpfField) {
                    cpfField.value = selected.cpf;
                }
                if (companyField) {
                    companyField.value = selected.empresa;
                }
                if (departmentField) {
                    departmentField.value = selected.departamento;
                }
                if (roleField) {
                    roleField.value = selected.cargo;
                }
                renderCollaboratorSyncWarning();
            };

            const applyCollaboratorSelection = () => {
                ensureInUseForCollaborator();
                const selected = findOptionByName(collaboratorInput.value);
                if (selected) {
                    applyCollaboratorData(selected);
                    return;
                }
                setCollaboratorReference(findOptionFromFields());
                renderCollaboratorSyncWarning();
            };

            collaboratorInput.addEventListener("input", () => {
                ensureInUseForCollaborator();
                renderCollaboratorSyncWarning();
            });
            collaboratorInput.addEventListener("change", applyCollaboratorSelection);
            collaboratorInput.addEventListener("blur", applyCollaboratorSelection);
            [emailField, cpfField, companyField, departmentField, roleField].filter(Boolean).forEach((field) => {
                field.addEventListener("input", renderCollaboratorSyncWarning);
                field.addEventListener("change", () => {
                    const selected = findOptionByEmail(emailField?.value) || findOptionByCpf(cpfField?.value);
                    if (selected && (!selectedCollaborator || selected.dataset.id !== selectedCollaborator.id)) {
                        applyCollaboratorData(selected);
                        return;
                    }
                    renderCollaboratorSyncWarning();
                });
            });

            setCollaboratorReference(findOptionFromFields());
            renderCollaboratorSyncWarning();
        }

        const ownerDateWrap = equipmentForm.querySelector("[data-owner-change-date]");
        const ownerDateInput = equipmentForm.querySelector("[name='data_troca_dono']");
        const ownerFields = ["usuario_final"]
            .map((name) => equipmentForm.querySelector(`[name='${name}']`))
            .filter(Boolean);
        const normalize = (value) => (value || "").trim().toLowerCase();
        const todayIso = () => {
            const today = new Date();
            today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
            return today.toISOString().slice(0, 10);
        };
        const formatCpf = (value) => {
            const digits = (value || "").replace(/\D/g, "").slice(0, 11);
            if (digits.length <= 3) {
                return digits;
            }
            if (digits.length <= 6) {
                return `${digits.slice(0, 3)}.${digits.slice(3)}`;
            }
            if (digits.length <= 9) {
                return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
            }
            return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
        };

        if (ownerDateWrap && ownerDateInput && ownerFields.length) {
            const originalValues = new Map(
                ownerFields.map((field) => [field, normalize(field.defaultValue)])
            );

            const updateOwnerDateVisibility = () => {
                const changed = ownerFields.some(
                    (field) => normalize(field.value) !== originalValues.get(field)
                );

                if (changed && !ownerDateInput.value) {
                    ownerDateInput.value = todayIso();
                    ownerDateInput.dataset.autoFilled = "1";
                }

                if (!changed && ownerDateInput.dataset.autoFilled === "1") {
                    ownerDateInput.value = "";
                    ownerDateInput.dataset.autoFilled = "";
                }

                ownerDateWrap.classList.toggle("is-visible", changed || Boolean(ownerDateInput.value));
            };

            ownerFields.forEach((field) => {
                field.addEventListener("input", updateOwnerDateVisibility);
                field.addEventListener("change", updateOwnerDateVisibility);
            });
            ownerDateInput.addEventListener("input", () => {
                ownerDateInput.dataset.autoFilled = "";
            });
            updateOwnerDateVisibility();
        }

        document.querySelectorAll("[data-cpf-mask], [name='cpf_colaborador']").forEach((cpfField) => {
            cpfField.addEventListener("input", () => {
                cpfField.value = formatCpf(cpfField.value);
            });
        });
    }

    const invoiceForm = document.querySelector("[data-invoice-form]");
    if (invoiceForm) {
        const fileInput = invoiceForm.querySelector("[name='arquivo_nf']");
        const readButton = invoiceForm.querySelector("[data-invoice-pdf-read]");
        const statusText = invoiceForm.querySelector("[data-invoice-pdf-status]");
        const resultBox = invoiceForm.querySelector("[data-invoice-pdf-result]");
        const previewFlag = invoiceForm.querySelector("[data-invoice-pdf-preview-flag]");
        const tagsField = invoiceForm.querySelector("[name='service_tags']");
        const numeroField = invoiceForm.querySelector("[name='numero']");
        const paganteField = invoiceForm.querySelector("[name='pagante']");
        const fornecedorField = invoiceForm.querySelector("[name='fornecedor']");
        const dataCompraField = invoiceForm.querySelector("[name='data_compra']");
        const csrfField = invoiceForm.querySelector("[name='_csrf_token']");

        const splitTags = (value) => (value || "")
            .split(/[\s,;]+/)
            .map((item) => item.trim().toUpperCase())
            .filter(Boolean);

        const appendTags = (tags) => {
            if (!tagsField || !tags?.length) {
                return;
            }

            const existing = splitTags(tagsField.value);
            const seen = new Set(existing);
            tags.forEach((tag) => {
                const normalized = String(tag || "").trim().toUpperCase();
                if (normalized && !seen.has(normalized)) {
                    existing.push(normalized);
                    seen.add(normalized);
                }
            });
            tagsField.value = existing.join("\n");
        };

        const fillField = (field, value, replace = false) => {
            const normalized = String(value || "").trim();
            if (!field || !normalized || field.readOnly || field.disabled) {
                return;
            }
            if (replace || !field.value.trim()) {
                field.value = normalized;
                field.dispatchEvent(new Event("input", { bubbles: true }));
                field.dispatchEvent(new Event("change", { bubbles: true }));
            }
        };

        const addResultGroup = (container, title, items, formatter) => {
            if (!items?.length) {
                return;
            }

            const group = document.createElement("div");
            group.className = "invoice-pdf-result-group";

            const heading = document.createElement("strong");
            heading.textContent = title;
            group.appendChild(heading);

            const list = document.createElement("div");
            list.className = "invoice-pdf-tags";
            items.forEach((item) => {
                const chip = document.createElement("span");
                chip.className = "invoice-pdf-tag";
                chip.textContent = formatter(item);
                list.appendChild(chip);
            });
            group.appendChild(list);
            container.appendChild(group);
        };

        const renderPdfItems = (container, items, titleText = "Itens detectados no PDF") => {
            if (!items?.length) {
                return;
            }

            const group = document.createElement("div");
            group.className = "invoice-pdf-result-group invoice-pdf-items";

            const heading = document.createElement("strong");
            heading.textContent = titleText;
            group.appendChild(heading);

            items.forEach((item) => {
                const row = document.createElement("div");
                row.className = "invoice-pdf-item-row";

                const descriptionInput = document.createElement("input");
                descriptionInput.type = "hidden";
                descriptionInput.name = "pdf_item_descricao";
                descriptionInput.value = item.descricao || "";

                const observationInput = document.createElement("input");
                observationInput.type = "hidden";
                observationInput.name = "pdf_item_observacoes";
                observationInput.value = item.observacoes || "Detectado no PDF/DANFE";

                const label = document.createElement("span");
                label.textContent = item.descricao || "Item sem Service Tag";

                const quantity = document.createElement("input");
                quantity.type = "number";
                quantity.name = "pdf_item_quantidade";
                quantity.min = "0";
                quantity.step = "1";
                quantity.value = String(item.quantidade || 1);
                quantity.setAttribute("aria-label", `Quantidade de ${item.descricao || "item sem Service Tag"}`);

                const quantityLabel = document.createElement("small");
                quantityLabel.textContent = `Qtd. ${item.quantidade || 1}`;

                row.appendChild(descriptionInput);
                row.appendChild(observationInput);
                row.appendChild(label);
                row.appendChild(quantityLabel);
                row.appendChild(quantity);
                group.appendChild(row);
            });

            container.appendChild(group);
        };

        const renderDetectedProducts = (container, products) => {
            if (!products?.length) {
                return;
            }

            const group = document.createElement("div");
            group.className = "invoice-pdf-result-group invoice-pdf-products";

            const heading = document.createElement("strong");
            heading.textContent = "Itens que esta NF esta trazendo";
            group.appendChild(heading);

            products.forEach((product) => {
                const row = document.createElement("div");
                row.className = "invoice-pdf-product-row";

                const label = document.createElement("span");
                label.textContent = product.descricao || "Produto detectado";

                const quantity = document.createElement("small");
                quantity.textContent = `Qtd. ${product.quantidade || 1}`;

                row.appendChild(label);
                row.appendChild(quantity);
                group.appendChild(row);
            });

            container.appendChild(group);
        };

        const renderExistingInvoice = (container, invoice) => {
            if (!invoice) {
                return;
            }

            const group = document.createElement("div");
            group.className = "invoice-pdf-result-group invoice-pdf-existing";

            const heading = document.createElement("strong");
            heading.textContent = `NF ${invoice.numero || ""} ja cadastrada`;
            group.appendChild(heading);

            const meta = document.createElement("small");
            const counts = [
                `${invoice.equipamentos?.length || 0} equipamento(s)`,
                `${invoice.itens_sem_tag?.length || 0} item(ns) sem tag`,
                `${invoice.pendentes?.length || 0} pendencia(s)`,
            ];
            meta.textContent = [
                invoice.pagante || "",
                invoice.fornecedor || "",
                invoice.data_compra || "",
                counts.join(" | "),
            ].filter(Boolean).join(" | ");
            group.appendChild(meta);

            if (invoice.url) {
                const link = document.createElement("a");
                link.className = "btn btn-secondary btn-compact";
                link.href = invoice.url;
                link.textContent = "Abrir NF existente";
                group.appendChild(link);
            }

            if (invoice.equipamentos?.length) {
                addResultGroup(
                    group,
                    "Ja vinculados nesta NF",
                    invoice.equipamentos,
                    (item) => [item.service_tag, item.patrimonio, item.nome].filter(Boolean).join(" - ")
                );
            }

            if (invoice.itens_sem_tag?.length) {
                addResultGroup(
                    group,
                    "Itens ja cadastrados nesta NF",
                    invoice.itens_sem_tag,
                    (item) => `${item.quantidade || 0}x ${item.descricao || "Item sem Service Tag"}`
                );
            }

            container.appendChild(group);
        };

        const renderPdfResult = (data) => {
            if (!resultBox) {
                return;
            }

            resultBox.innerHTML = "";
            resultBox.classList.remove("is-hidden");

            const title = document.createElement("strong");
            title.textContent = data.message || "PDF lido.";
            resultBox.appendChild(title);

            if (data.numero) {
                const nf = document.createElement("small");
                nf.textContent = `Numero de NF sugerido: ${data.numero}`;
                resultBox.appendChild(nf);
            }

            [
                ["Pagante sugerido", data.pagante],
                ["Fornecedor sugerido", data.fornecedor],
                ["Data sugerida", data.data_compra],
            ].forEach(([label, value]) => {
                if (!value) {
                    return;
                }
                const item = document.createElement("small");
                item.textContent = `${label}: ${value}`;
                resultBox.appendChild(item);
            });

            renderDetectedProducts(resultBox, data.produtos_detectados || []);
            renderExistingInvoice(resultBox, data.invoice_existente);

            addResultGroup(
                resultBox,
                "Encontradas no inventario",
                data.equipamentos || [],
                (item) => [item.service_tag, item.patrimonio, item.nome].filter(Boolean).join(" - ")
            );
            addResultGroup(
                resultBox,
                "Ficarao em pendencia",
                data.pendentes || [],
                (tag) => tag
            );
            renderPdfItems(resultBox, data.itens_sem_tag || []);
        };

        fileInput?.addEventListener("change", () => {
            if (previewFlag) {
                previewFlag.value = "";
            }
            if (statusText) {
                statusText.textContent = "";
            }
            resultBox?.classList.add("is-hidden");
        });

        readButton?.addEventListener("click", async () => {
            const file = fileInput?.files?.[0];
            if (!file) {
                showToast("Selecione um PDF da NF antes de ler.", "error");
                return;
            }

            const formData = new FormData();
            formData.append("arquivo_nf", file);
            if (csrfField?.value) {
                formData.append("_csrf_token", csrfField.value);
            }

            const originalText = readButton.textContent;
            readButton.disabled = true;
            readButton.textContent = "Lendo...";
            if (statusText) {
                statusText.textContent = "Analisando PDF...";
            }

            try {
                const response = await fetch(readButton.dataset.readUrl, {
                    method: "POST",
                    body: formData,
                    headers: csrfField?.value ? { "X-CSRFToken": csrfField.value } : {},
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok || !data.ok) {
                    throw new Error(data.message || "Nao consegui ler este PDF.");
                }

                appendTags(data.service_tags || []);
                fillField(numeroField, data.numero, true);
                fillField(paganteField, data.pagante, true);
                fillField(fornecedorField, data.fornecedor, true);
                fillField(dataCompraField, data.data_compra, true);
                if (previewFlag) {
                    previewFlag.value = "1";
                }
                if (statusText) {
                    statusText.textContent = data.message || "PDF lido.";
                }
                renderPdfResult(data);
                showToast(data.message || "PDF lido.", data.invoice_existente || data.status !== "ok" ? "warning" : "success");
            } catch (error) {
                if (previewFlag) {
                    previewFlag.value = "";
                }
                if (statusText) {
                    statusText.textContent = error.message;
                }
                showToast(error.message, "error");
            } finally {
                readButton.disabled = false;
                readButton.textContent = originalText;
            }
        });
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;",
        }[character]));
    }

    function setSoftwaresMessage(messageBox, text) {
        if (!messageBox) {
            return;
        }
        messageBox.textContent = text;
        messageBox.style.display = "";
    }

    async function readJsonResponse(response) {
        const text = await response.text();
        if (!text) {
            return {};
        }
        try {
            return JSON.parse(text);
        } catch (error) {
            return { error: text.slice(0, 300) };
        }
    }

    function formatBrazilianDate(value, includeTime = false) {
        const text = String(value || "").trim();
        if (!text || text === "-") {
            return text || "-";
        }

        const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
        if (isoMatch) {
            const [, year, month, day, hour, minute] = isoMatch;
            const dateText = `${day}/${month}/${year}`;
            if (includeTime && hour && minute && `${hour}:${minute}` !== "00:00") {
                return `${dateText} ${hour}:${minute}`;
            }
            return dateText;
        }

        const compactMatch = text.match(/^(\d{4})(\d{2})(\d{2})$/);
        if (compactMatch) {
            const [, year, month, day] = compactMatch;
            return `${day}/${month}/${year}`;
        }

        return text;
    }

    function setupEquipmentSoftwaresPanel() {
        const button = document.getElementById("btn-softwares");
        if (!button) {
            return;
        }

        const panel = document.getElementById("softwares-panel");
        const loading = document.getElementById("softwares-loading");
        const meta = document.getElementById("softwares-meta");
        const message = document.getElementById("softwares-message");
        const table = document.getElementById("softwares-table");
        const tableWrap = document.getElementById("softwares-table-wrap");
        const tbody = document.getElementById("softwares-tbody");
        const total = document.getElementById("softwares-total");
        const status = document.getElementById("softwares-status");
        const scanDateMetric = document.getElementById("softwares-scan-date");
        const scan = document.getElementById("softwares-scan");
        const stateBadge = document.getElementById("softwares-state-badge");

        function setMetric(element, value) {
            if (element) {
                element.textContent = value || "-";
            }
        }

        function setAcronisState(text, modifier) {
            if (!stateBadge) {
                return;
            }
            stateBadge.textContent = text;
            stateBadge.className = `acronis-status-badge ${modifier || "is-muted"}`;
        }

        button.addEventListener("click", async () => {
            const url = button.dataset.softwaresUrl;
            if (!url || !panel || !loading || !message || !table || !tableWrap || !tbody) {
                showToast("Nao encontrei a configuracao da consulta Acronis nesta tela.", "error");
                return;
            }

            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = "Consultando...";
            panel.style.display = "block";
            panel.classList.add("is-loading");
            loading.style.display = "";
            setAcronisState("Consultando", "is-syncing");
            setMetric(total, "-");
            setMetric(status, "Consultando");
            setMetric(scanDateMetric, "-");
            setMetric(scan, "Aguardando consulta");
            if (meta) {
                meta.textContent = "";
                meta.style.display = "none";
            }
            message.textContent = "";
            message.style.display = "none";
            tableWrap.style.display = "none";
            tbody.innerHTML = "";

            try {
                const response = await fetch(url, {
                    credentials: "same-origin",
                    headers: { Accept: "application/json" },
                });
                const body = await readJsonResponse(response);
                if (!response.ok) {
                    throw new Error(body.error || body.message || `Erro ${response.status} ao consultar o Acronis.`);
                }

                const agent = body.agent || null;
                const softwareDevice = body.software_device || null;
                const apps = body.applications || [];
                const scanDate = body.scan_time_display || formatBrazilianDate(softwareDevice?.scan_time || softwareDevice?.last_scan_time || softwareDevice?.updated_at || "-", true);

                setMetric(total, String(apps.length));
                setMetric(status, agent || softwareDevice ? "Conectado" : "Aguardando");
                setMetric(scanDateMetric, scanDate && scanDate !== "-" ? scanDate : "-");
                setMetric(scan, "Software Inventory");

                if ((agent || softwareDevice) && meta) {
                    meta.textContent = agent ? "Agente encontrado" : "Inventario de software";
                    meta.style.display = "";
                }

                if (body.error && !apps.length) {
                    setAcronisState("Com alerta", "is-warning");
                    setMetric(status, "Com alerta");
                    setSoftwaresMessage(message, body.error);
                    return;
                }

                if (!apps.length) {
                    setAcronisState("Sem apps", "is-muted");
                    setMetric(status, "Sem apps");
                    setSoftwaresMessage(message, "Nenhum software listado pelo Acronis para este agente.");
                    return;
                }

                setAcronisState("Conectado", "is-online");
                setMetric(status, "Conectado");
                apps.forEach((app) => {
                    const name = app.name || app.displayName || app.applicationName || "-";
                    const version = app.version || app.displayVersion || app.applicationVersion || "-";
                    const vendor = app.publisher || app.vendor || "-";
                    const installedAt = formatBrazilianDate(app.install_date || app.installDate || app.installedAt || "-");
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td data-label="Software"><strong class="acronis-software-name">${escapeHtml(name)}</strong></td>
                        <td data-label="Versao">${escapeHtml(version)}</td>
                        <td data-label="Fornecedor">${escapeHtml(vendor)}</td>
                        <td data-label="Instalado em">${escapeHtml(installedAt)}</td>
                    `;
                    tbody.appendChild(row);
                });
                tableWrap.style.display = "";
                table.style.display = "";
            } catch (error) {
                setAcronisState("Erro", "is-warning");
                setMetric(status, "Erro");
                setSoftwaresMessage(message, error.message || "Erro ao conectar com a API.");
                showToast(error.message || "Erro ao conectar com a API.", "error");
            } finally {
                loading.style.display = "none";
                panel.classList.remove("is-loading");
                button.disabled = false;
                button.textContent = originalText;
            }
        });
    }

    function setupEquipmentGenaiPanel() {
        const button = document.getElementById("btn-genai");
        if (!button) {
            return;
        }

        const panel = document.getElementById("genai-panel");
        const loading = document.getElementById("genai-loading");
        const message = document.getElementById("genai-message");
        const tableWrap = document.getElementById("genai-table-wrap");
        const tbody = document.getElementById("genai-tbody");
        const alertsBlock = document.getElementById("genai-alerts-block");
        const alertsTbody = document.getElementById("genai-alerts-tbody");
        const total = document.getElementById("genai-total");
        const coverage = document.getElementById("genai-coverage");
        const coverageDetail = document.getElementById("genai-coverage-detail");
        const alertsTotal = document.getElementById("genai-alerts-total");
        const stateBadge = document.getElementById("genai-state-badge");

        function setMetric(element, value) {
            if (element) {
                element.textContent = value || "-";
            }
        }

        function setGenaiState(text, modifier) {
            if (!stateBadge) {
                return;
            }
            stateBadge.textContent = text;
            stateBadge.className = `acronis-status-badge ${modifier || "is-muted"}`;
        }

        function showGenaiMessage(text) {
            if (!message) {
                return;
            }
            message.textContent = text || "";
            message.style.display = text ? "" : "none";
        }

        button.addEventListener("click", async () => {
            const url = button.dataset.genaiUrl;
            if (!url || !panel || !loading || !message || !tableWrap || !tbody) {
                showToast("Nao encontrei a configuracao da consulta GenAI nesta tela.", "error");
                return;
            }

            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = "Consultando...";
            panel.style.display = "block";
            panel.classList.add("is-loading");
            loading.style.display = "";
            tableWrap.style.display = "none";
            tbody.innerHTML = "";
            if (alertsBlock) {
                alertsBlock.style.display = "none";
            }
            if (alertsTbody) {
                alertsTbody.innerHTML = "";
            }
            setGenaiState("Consultando", "is-syncing");
            setMetric(total, "-");
            setMetric(coverage, "Consultando");
            setMetric(coverageDetail, "Aguardando consulta");
            setMetric(alertsTotal, "-");
            showGenaiMessage("");

            try {
                const response = await fetch(url, {
                    credentials: "same-origin",
                    headers: { Accept: "application/json" },
                });
                const body = await readJsonResponse(response);
                if (!response.ok) {
                    throw new Error(body.error || body.message || `Erro ${response.status} ao consultar GenAI.`);
                }

                const apps = body.applications || [];
                const alerts = body.alerts || [];
                const protection = body.coverage || {};
                const protectedEndpoints = Number(protection.value || protection.absolute_value || 0);

                setMetric(total, String(apps.length));
                setMetric(alertsTotal, String(alerts.length));
                setMetric(coverage, protection.enabled ? "Ativo" : "Nao ativo");
                setMetric(
                    coverageDetail,
                    protectedEndpoints > 0 ? `${protectedEndpoints} endpoints protegidos` : (protection.error || "Sem contagem retornada")
                );
                setGenaiState(protection.enabled ? "Protegido" : "Sem cobertura", protection.enabled ? "is-online" : "is-warning");

                if (!apps.length) {
                    showGenaiMessage(body.source_status || "Nenhum aplicativo de IA detectado para este patrimonio.");
                } else {
                    apps.forEach((app) => {
                        const row = document.createElement("tr");
                        row.innerHTML = `
                            <td data-label="IA"><strong class="acronis-software-name">${escapeHtml(app.family || "-")}</strong></td>
                            <td data-label="Aplicativo">${escapeHtml(app.name || "-")}</td>
                            <td data-label="Versao">${escapeHtml(app.version || "-")}</td>
                            <td data-label="Fornecedor">${escapeHtml(app.publisher || "-")}</td>
                            <td data-label="Fonte">${escapeHtml(app.source || "Acronis")}</td>
                        `;
                        tbody.appendChild(row);
                    });
                    tableWrap.style.display = "";
                    if (body.source_status) {
                        showGenaiMessage(body.source_status);
                    }
                }

                if (alerts.length && alertsBlock && alertsTbody) {
                    alerts.forEach((alert) => {
                        const row = document.createElement("tr");
                        row.innerHTML = `
                            <td data-label="Ocorrencia"><strong class="acronis-software-name">${escapeHtml(alert.title || alert.type || "-")}</strong></td>
                            <td data-label="Severidade">${escapeHtml(alert.severity || "-")}</td>
                            <td data-label="Recurso">${escapeHtml(alert.resource_name || "-")}</td>
                            <td data-label="Data">${escapeHtml(formatBrazilianDate(alert.created_at || "-", true))}</td>
                        `;
                        alertsTbody.appendChild(row);
                    });
                    alertsBlock.style.display = "";
                }
            } catch (error) {
                setGenaiState("Erro", "is-warning");
                setMetric(coverage, "Erro");
                showGenaiMessage(error.message || "Erro ao conectar com a API GenAI.");
                showToast(error.message || "Erro ao conectar com a API GenAI.", "error");
            } finally {
                loading.style.display = "none";
                panel.classList.remove("is-loading");
                button.disabled = false;
                button.textContent = originalText;
            }
        });
    }

    setupEquipmentSoftwaresPanel();
    setupEquipmentGenaiPanel();

    const appBody = document.querySelector(".app-body");
    if (!appBody) {
        return;
    }

    const sidebar = document.querySelector(".sidebar-v2");
    const sidebarToggle = document.querySelector("[data-sidebar-toggle]");

    if (sidebar && sidebarToggle) {
        const storageKey = "invy:sidebar:collapsed";
        const focusableItems = sidebar.querySelectorAll("a, button, input, select, textarea, [tabindex]");

        const readSidebarState = () => {
            try {
                return window.localStorage.getItem(storageKey) === "1";
            } catch (error) {
                return false;
            }
        };

        const saveSidebarState = (collapsed) => {
            try {
                window.localStorage.setItem(storageKey, collapsed ? "1" : "0");
            } catch (error) {
                // Navegadores com armazenamento bloqueado ainda podem usar o botao nesta tela.
            }
        };

        const setSidebarState = (collapsed, shouldSave) => {
            appBody.classList.toggle("sidebar-is-collapsed", collapsed);
            sidebar.setAttribute("aria-hidden", String(collapsed));
            sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
            sidebarToggle.setAttribute("aria-label", collapsed ? "Mostrar menu lateral" : "Esconder menu lateral");
            sidebarToggle.setAttribute("title", collapsed ? "Mostrar menu lateral" : "Esconder menu lateral");

            focusableItems.forEach((item) => {
                if (collapsed) {
                    if (item.hasAttribute("tabindex")) {
                        item.dataset.previousTabindex = item.getAttribute("tabindex");
                    }

                    item.setAttribute("tabindex", "-1");
                    return;
                }

                if (item.dataset.previousTabindex !== undefined) {
                    item.setAttribute("tabindex", item.dataset.previousTabindex);
                    delete item.dataset.previousTabindex;
                    return;
                }

                item.removeAttribute("tabindex");
            });

            if (shouldSave) {
                saveSidebarState(collapsed);
            }
        };

        setSidebarState(readSidebarState(), false);

        sidebarToggle.addEventListener("click", () => {
            setSidebarState(!appBody.classList.contains("sidebar-is-collapsed"), true);
        });
    }

    function setupTermSignaturePreview() {
        document.querySelectorAll("[data-term-signature-form]").forEach((form) => {
            const preview = form.querySelector("[data-term-preview]");
            const marker = form.querySelector("[data-term-marker]");
            const xInput = form.querySelector("[data-term-x]");
            const yInput = form.querySelector("[data-term-y]");
            if (!preview || !marker || !xInput || !yInput) {
                return;
            }

            const docWidth = 595;
            const docHeight = 842;
            const defaultX = Number.parseInt(form.dataset.defaultX || xInput.value, 10) || 278;
            const defaultY = Number.parseInt(form.dataset.defaultY || yInput.value, 10) || 392;
            let dragging = false;

            function clamp(value, min, max) {
                return Math.max(min, Math.min(max, value));
            }

            function setValues(x, y) {
                const safeX = Math.round(clamp(x, 0, docWidth));
                const safeY = Math.round(clamp(y, 0, docHeight));
                xInput.value = String(safeX);
                yInput.value = String(safeY);
                marker.style.left = `${(safeX / docWidth) * 100}%`;
                marker.style.top = `${(safeY / docHeight) * 100}%`;
            }

            function setFromPointer(event) {
                const rect = preview.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * docWidth;
                const y = ((event.clientY - rect.top) / rect.height) * docHeight;
                setValues(x, y);
            }

            preview.addEventListener("click", (event) => {
                if (event.target === marker) {
                    return;
                }
                setFromPointer(event);
            });

            marker.addEventListener("pointerdown", (event) => {
                dragging = true;
                marker.setPointerCapture(event.pointerId);
                setFromPointer(event);
            });

            marker.addEventListener("pointermove", (event) => {
                if (dragging) {
                    setFromPointer(event);
                }
            });

            marker.addEventListener("pointerup", () => {
                dragging = false;
            });

            marker.addEventListener("pointercancel", () => {
                dragging = false;
            });

            [xInput, yInput].forEach((input) => {
                input.addEventListener("input", () => {
                    setValues(Number.parseInt(xInput.value, 10) || 0, Number.parseInt(yInput.value, 10) || 0);
                });
            });

            form.querySelectorAll("[data-term-preset]").forEach((button) => {
                button.addEventListener("click", () => {
                    const preset = button.getAttribute("data-term-preset");
                    if (preset === "left") {
                        setValues(90, defaultY);
                    } else if (preset === "right") {
                        setValues(410, defaultY);
                    } else {
                        setValues(defaultX, defaultY);
                    }
                });
            });

            setValues(Number.parseInt(xInput.value, 10) || defaultX, Number.parseInt(yInput.value, 10) || defaultY);
        });
    }

    function setupTermStatusAutoRefresh() {
        document.querySelectorAll("[data-term-status-board]").forEach((board) => {
            const url = board.getAttribute("data-refresh-url");
            const ids = board.getAttribute("data-refresh-ids");
            if (!url || !ids) {
                return;
            }

            const refresh = async () => {
                try {
                    const response = await fetch(`${url}?ids=${encodeURIComponent(ids)}`, {
                        headers: { "Accept": "application/json" },
                        credentials: "same-origin",
                    });
                    if (!response.ok) {
                        return;
                    }
                    const payload = await response.json();
                    (payload.terms || []).forEach((term) => {
                        const row = document.querySelector(`[data-term-row="${term.id}"]`);
                        if (!row) {
                            return;
                        }
                        const status = row.querySelector("[data-term-status]");
                        if (status) {
                            status.textContent = term.status_label || term.status || "-";
                            status.className = `term-status-badge status-${term.status || "created"}`;
                        }
                        const completed = row.querySelector("[data-term-completed]");
                        if (completed) {
                            completed.textContent = term.completed_at || "-";
                        }
                        const checked = row.querySelector("[data-term-checked]");
                        if (checked) {
                            checked.textContent = term.checked_at || "-";
                        }
                        const cpf = row.querySelector("[data-term-cpf]");
                        if (cpf) {
                            cpf.textContent = term.signer_cpf || "-";
                        }
                        const returnCondition = row.querySelector("[data-term-return-condition]");
                        if (returnCondition) {
                            returnCondition.textContent = term.return_condition_label || "Condição pendente";
                        }
                        const actions = row.querySelector(".term-doc-actions");
                        if (actions && term.signed_available && !row.querySelector("[data-term-signed-link]")) {
                            const link = document.createElement("a");
                            link.className = "btn btn-secondary btn-compact";
                            link.dataset.termSignedLink = "1";
                            link.href = row.getAttribute("data-signed-url") || "#";
                            link.textContent = "Assinado";
                            actions.appendChild(link);
                        }
                        const returnStock = row.querySelector("[data-term-return-stock]");
                        if (returnStock && term.return_processed) {
                            returnStock.textContent = `Estoque confirmado: ${term.return_processed_at || "-"}`;
                        }
                    });
                } catch (error) {
                    // A tela continua funcional mesmo se a consulta falhar.
                }
            };

            refresh();
            window.setInterval(refresh, 30000);
        });
    }

    function setupEquipmentLinkSearch() {
        document.querySelectorAll("[data-equipment-link-search-form]").forEach((form) => {
            const input = form.querySelector("[data-equipment-search-input]");
            const idInput = form.querySelector("[data-equipment-id-input]");
            const results = form.querySelector("[data-equipment-search-results]");
            const searchUrl = input?.dataset.searchUrl;
            if (!input || !idInput || !results || !searchUrl) {
                return;
            }

            let timer = 0;
            let lastQuery = "";

            const clearResults = () => {
                results.replaceChildren();
                results.hidden = true;
            };

            const renderEmpty = (message) => {
                const empty = document.createElement("div");
                empty.className = "equipment-link-empty";
                empty.textContent = message;
                results.replaceChildren(empty);
                results.hidden = false;
            };

            const renderItems = (items) => {
                if (!items.length) {
                    renderEmpty("Nenhum patrimonio encontrado.");
                    return;
                }

                const fragment = document.createDocumentFragment();
                items.forEach((item) => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "equipment-link-result";
                    button.disabled = !item.disponivel;
                    button.dataset.equipmentId = String(item.id || "");
                    button.dataset.equipmentCode = item.patrimonio || item.service_tag || "";

                    const main = document.createElement("span");
                    main.className = "equipment-link-main";

                    const title = document.createElement("strong");
                    title.textContent = item.patrimonio || "-";
                    main.appendChild(title);

                    const detail = document.createElement("span");
                    detail.textContent = [item.tipo, item.nome].filter(Boolean).join(" | ") || "-";
                    main.appendChild(detail);

                    const meta = document.createElement("small");
                    meta.textContent = [item.service_tag, item.nf ? `NF ${item.nf}` : "", item.pagante].filter(Boolean).join(" • ") || "Sem detalhes extras";
                    main.appendChild(meta);

                    const badge = document.createElement("em");
                    badge.className = item.disponivel ? "is-available" : "is-blocked";
                    badge.textContent = item.motivo || (item.disponivel ? "Disponivel" : "Indisponivel");

                    button.append(main, badge);
                    fragment.appendChild(button);
                });

                results.replaceChildren(fragment);
                results.hidden = false;
            };

            const search = async () => {
                const query = input.value.trim();
                idInput.value = "";
                if (query.length < 2) {
                    clearResults();
                    return;
                }
                lastQuery = query;
                const requestedQuery = query;

                try {
                    const url = new URL(searchUrl, window.location.href);
                    url.searchParams.set("q", query);
                    const response = await fetch(url.toString(), {
                        headers: { "Accept": "application/json" },
                        credentials: "same-origin",
                    });
                    if (!response.ok) {
                        return;
                    }
                    const payload = await response.json();
                    if (input.value.trim() !== requestedQuery || lastQuery !== requestedQuery) {
                        return;
                    }
                    renderItems(payload.items || []);
                } catch (error) {
                    renderEmpty("Nao foi possivel consultar agora.");
                }
            };

            input.addEventListener("input", () => {
                window.clearTimeout(timer);
                timer = window.setTimeout(search, 180);
            });

            input.addEventListener("focus", () => {
                if (results.childElementCount) {
                    results.hidden = false;
                }
            });

            document.addEventListener("click", (event) => {
                if (!form.contains(event.target)) {
                    results.hidden = true;
                }
            });

            results.addEventListener("click", (event) => {
                const button = event.target.closest(".equipment-link-result");
                if (!button || button.disabled) {
                    return;
                }
                idInput.value = button.dataset.equipmentId || "";
                input.value = button.dataset.equipmentCode || input.value;
                lastQuery = "";
                clearResults();
                showToast("Patrimonio selecionado para vinculo.", "success");
            });
        });
    }

    function setupTermCorrectionButtons() {
        document.querySelectorAll("[data-term-correct-fields]").forEach((button) => {
            button.addEventListener("click", () => {
                const form = button.closest("[data-term-signature-form]");
                if (!form) {
                    return;
                }
                form.classList.add("is-reviewing-fields");
                const firstField = form.querySelector("[name='signer_name'], [name='signer_email']");
                firstField?.focus({ preventScroll: true });
                firstField?.scrollIntoView({ behavior: "smooth", block: "center" });
                showToast("Confira nome, e-mail, CPF, copias e mensagem antes de enviar.", "warning");
                window.setTimeout(() => form.classList.remove("is-reviewing-fields"), 4200);
            });
        });
    }

    const animatedItems = document.querySelectorAll(
        ".workspace-bar, .topbar, .stat-box, .panel, .equipment-result-card, .history-card, .history-event-card, .owner-card, .table-wrap tbody tr"
    );

    animatedItems.forEach((item, index) => {
        item.classList.add("tech-in");
        item.style.setProperty("--motion-delay", `${Math.min(index * 18, 260)}ms`);
    });

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function animateStatNumber(element) {
        const rawValue = element.textContent.trim();
        const numericValue = rawValue.replace(/[^\d]/g, "");

        if (!numericValue || prefersReducedMotion) {
            return;
        }

        const target = Number.parseInt(numericValue, 10);
        if (!Number.isFinite(target) || target < 1 || target > 999999) {
            return;
        }

        const formatter = new Intl.NumberFormat("pt-BR");
        const start = performance.now();
        const duration = 820;

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = formatter.format(Math.round(target * eased));

            if (progress < 1) {
                window.requestAnimationFrame(tick);
            }
        }

        element.textContent = "0";
        window.requestAnimationFrame(tick);
    }

    function setupHistoryDetails() {
        const detailsItems = document.querySelectorAll("[data-history-details]");
        if (!detailsItems.length) {
            return;
        }

        detailsItems.forEach((details, index) => {
            const summary = details.querySelector("summary");

            if (index === 0 && details.closest("[data-history-card]")) {
                details.open = true;
            }

            const syncState = () => {
                details.classList.toggle("is-open", details.open);
                if (summary) {
                    summary.textContent = details.open ? "Ocultar detalhes" : "Ver detalhes do evento";
                }
            };

            details.addEventListener("toggle", syncState);
            syncState();
        });
    }

    setupHistoryDetails();
    setupTermSignaturePreview();
    setupTermStatusAutoRefresh();
    setupEquipmentLinkSearch();
    setupTermCorrectionButtons();

    window.requestAnimationFrame(() => {
        appBody.classList.add("is-ready");
        document.querySelectorAll(".stat-box h3").forEach(animateStatNumber);
    });
})();
