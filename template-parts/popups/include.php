<div class="cookies _hide">
    <p class="text-s">Мы используем файлы «Cookie» и сервисы аналитики для улучшения работы сайта. Нажимая «Принять»,
        или
        продолжая
        пользоваться сайтом, вы соглашаетесь с <a href="" target="_blank">Обработкой данных.</a></p>
    <button class="arrow-btn text-m">Принять</button>
</div>

<div class="popup _fixed" id="propose">
    <div class="popup-body">
        <?php get_template_part('template-parts/popups/result'); ?>
        <button class="popup-close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#close')); ?>' />
            </svg>
        </button>
        <div class="form">
            <form action="">
                <div class="form__fields">
                    <div class="form__col">
                        <div class="form__col-title h4">Контактаня информация</div>
                        <div class="form__item" data-required>
                            <input type="text" placeholder="* Имя">
                        </div>
                        <div class="form__item">
                            <input type="text" placeholder="Компания">
                        </div>
                        <div class="form__item" data-required>
                            <input type="email" placeholder="* Email">
                        </div>
                        <div class="form__item">
                            <input type="text" placeholder="Tелефон">
                        </div>
                    </div>
                    <div class="form__col">
                        <div class="form__col-title h4">Информация об объекте</div>
                        <div class="form__item">
                            <input type="text" placeholder="Тип объекта">
                        </div>
                        <div class="form__item" data-required>
                            <input type="text" placeholder="* Локация">
                        </div>
                        <div class="form__item">
                            <input type="text" placeholder="Краткое описание">
                        </div>
                        <div class="form__upload primary-button">
                            <div class="codedropz-upload-wrapper">
                                <input size="40" class="wpcf7-form-control wpcf7-drag-n-drop-file d-none"
                                    aria-invalid="false" type="file" multiple="multiple" data-name="upload-file"
                                    data-type="csv|excel|xlsx|doc|docx|jpg|jpeg|png|pngx|webp|avif|pdf|txt|ppt|pptx|odt|avi|svg"
                                    data-min="0" data-max="3" data-id="9" data-version="free version 1.3.9.9"
                                    accept=".csv, .excel, .xlsx, .doc, .docx, .jpg, .jpeg, .png, .pngx, .webp, .avif, .pdf, .txt, .ppt, .pptx, .odt, .avi, .svg">
                                <div class="codedropz-upload-handler">
                                    <div class="codedropz-upload-container">
                                        <div class="codedropz-upload-inner">
                                            <div>&nbsp;</div>
                                            <span>&nbsp;</span>
                                            <div class="codedropz-btn-wrap"><a class="cd-upload-btn" href="#">Добавить
                                                    материалы</a></div>
                                        </div>
                                    </div>
                                    <span class="dnd-upload-counter"><span>0</span> из 3</span>
                                </div>
                            </div>
                        </div>
                        <div class="form__checkboxes">
                            <p class="primary-button">Стоимость / необходимый equity</p>
                            <span class="wpcf7-form-control wpcf7-checkbox">
                                <span class="wpcf7-list-item first">
                                    <label>
                                        <input type="checkbox" name="budget[]" value="до $100000"><span
                                            class="wpcf7-list-item-label">до $100000</span>
                                    </label>
                                </span>
                                <span class="wpcf7-list-item">
                                    <label>
                                        <input type="checkbox" name="budget[]" value="100000—$500000">
                                        <span class="wpcf7-list-item-label">100000—$500000</span>
                                    </label>
                                </span>
                                <span class="wpcf7-list-item last">
                                    <label>
                                        <input type="checkbox" name="budget[]" value="более $500000">
                                        <span class="wpcf7-list-item-label">более $500000</span>
                                    </label>
                                </span>
                            </span>
                            <div class="form__checkboxes-text primary-button">
                                <input type="text" name="budget_custom" placeholder="Свой вариант">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form__action">
                    <div class="form__privacy">
                        <span class="wpcf7-form-control wpcf7-acceptance optional"><span
                                class="wpcf7-list-item"><label><input type="checkbox" name="acceptance-999" value="1"
                                        aria-invalid="false"><span class="wpcf7-list-item-label">
                                        <p>Даю <span>Согласие</span> на обработку персональных данных в
                                            соответствии с
                                            <a href="/politika-konfidenczialnosti/" target="_blank">Политикой
                                                конфиденциальности.</a>
                                        </p>
                                    </span></label></span></span>
                    </div>
                    <button class="_btn _btn-black primary-button">Отправить</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="popup _fixed" id="contact-me">
    <div class="popup-body">
        <?php get_template_part('template-parts/popups/result'); ?>
        <button class="popup-close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#close')); ?>' />
            </svg>
        </button>
        <div class="form">
            <form action="">
                <div class="form__fields">
                    <div class="form__col">
                        <div class="form__item" data-required>
                            <input type="text" placeholder="* Имя">
                        </div>
                        <div class="form__item" data-required>
                            <input type="email" placeholder="* Email">
                        </div>
                        <div class="form__item">
                            <input type="text" placeholder="Tелефон">
                        </div>
                    </div>
                </div>
                <div class="form__action">
                    <div class="form__privacy">
                        <span class="wpcf7-form-control wpcf7-acceptance optional"><span
                                class="wpcf7-list-item"><label><input type="checkbox" name="acceptance-999" value="1"
                                        aria-invalid="false"><span class="wpcf7-list-item-label">
                                        <p>Даю <span>Согласие</span> на обработку персональных данных в
                                            соответствии с
                                            <a href="/politika-konfidenczialnosti/" target="_blank">Политикой
                                                конфиденциальности.</a>
                                        </p>
                                    </span></label></span></span>
                    </div>
                    <button class="_btn _btn-black primary-button">Отправить</button>
                </div>
            </form>
        </div>
    </div>
</div>