/**
 * simple-carousel
 * @version 1.3.0
 * @author Jasper Habicht
 * @license The MIT License (MIT)
 */
/* global window, document, console, setTimeout, clearTimeout, setInterval */
class Carousel {
  constructor(carouselParent, options) {
    this.carouselParent = carouselParent;
    this.appendRepeat = options.appendRepeat;
    this.loadSensitivity = options.loadSensitivity;
    this.hasNavigation = options.hasNavigation;
    this.navigationPrevSymbol = options.navigationPrevSymbol;
    this.navigationNextSymbol = options.navigationNextSymbol;
    this.hasAutoplay = options.hasAutoplay;
    this.autoplayDelay = options.autoplayDelay;
    this.hasTouch = options.hasTouch;
    this.touchError = options.touchError;
    this.jumpBackTimeout = options.jumpBackTimeout;
    this.resizeRepaintTimeout = options.resizeRepaintTimeout;
    Carousel.all.push(this);
  }

  /* helper array containing all instances of class */
  static all = [];

  /* helper functions for touch events */
  static touchMoveStartX = null;
  static touchMoveStartY = null;
  static touchUnify = (event) => {
    return event.changedTouches ? event.changedTouches[0] : event;
  };

  touchRecordPosition = (event) => {
    this.touchMoveStartX = Carousel.touchUnify(event).clientX;
    this.touchMoveStartY = Carousel.touchUnify(event).clientY;
    return true;
  };

  touchRecordMove = (event) => {
    let touchDistanceX = 0;
    let touchDistanceY = 0;
    if (this.touchMoveStartX || this.touchMoveStartX === 0) {
      touchDistanceX = Carousel.touchUnify(event).clientX - this.touchMoveStartX;
      this.touchMoveStartX = null;
    }
    if (this.touchMoveStartY || this.touchMoveStartY === 0) {
      touchDistanceY = Carousel.touchUnify(event).clientY - this.touchMoveStartY;
      this.touchMoveStartY = null;
    }
    if (Math.sign(touchDistanceX) < 0 
      && touchDistanceY < this.touchError 
      && touchDistanceY > (-1 * this.touchError)) {
      this.getNextItem();
      return true;
    }
    if (Math.sign(touchDistanceX) > 0 
      && touchDistanceY < this.touchError 
      && touchDistanceY > (-1 * this.touchError)) {
      this.getPrevItem();
      return true;
    }
    return false;
  };

  /* pseudo event called when first 5 images are loaded */
  unhideAfterLoading = (imagesArray) => {
    const visibleImagesLoading = Array(imagesArray.length).fill(1);
    for (let i = 0, j = imagesArray.length; i < j; i += 1) {
      imagesArray[i].addEventListener('load', () => {
        visibleImagesLoading[i] = 0;
        if (visibleImagesLoading.reduce((a, b) => a + b, 0) === 0) {
          this.carouselParent.classList.remove('loading');
          return true;
        }
        return false;
      }, { once: true });
      if (imagesArray[i].complete) {
        imagesArray[i].load();
      }
    }
    return false;
  }

  /* helper functions to center active item in carousel */
  centerActiveItem = (animate = true) => {
    const carouselItemWrapper = this.carouselParent.querySelector('.wrapper');
    const currentItem = carouselItemWrapper.querySelector('.active');
    const currentItemOffset = this.carouselParent.offsetWidth / 2 
      - currentItem.offsetLeft - currentItem.offsetWidth / 2;
    /* skip transition (relevant CSS class is needed) */
    if (animate === false) {
      carouselItemWrapper.classList.add('skip-transition');
    }
    carouselItemWrapper.style.transform = `translateX(${parseInt(currentItemOffset, 10)}px)`;
    /* force paint reflow */
    void carouselItemWrapper.offsetWidth;
    if (animate === false) {
      carouselItemWrapper.classList.remove('skip-transition');
    }
    return true;
  }

  /* select next item in carousel */
  getNextItem = () => {
    if (this.carouselParent.querySelectorAll('.item.active').length === 0) {
      this.carouselParent.querySelectorAll('.item')[0].classList.add('active');
    }
    const carouselItemWrapper = this.carouselParent.querySelector('.wrapper');
    const currentItem = carouselItemWrapper.querySelector('.active');
    currentItem.classList.remove('active');
    try {
      currentItem.nextSibling.classList.add('active');
    } catch (error) {
      console.debug('Next item currently not accessible.');
    }
    this.centerActiveItem();
    /* handle last item: jump to start after animation */
    window.setTimeout(() => {
      try {
        if (currentItem.nextSibling.classList.contains('cloned')) {
          currentItem.nextSibling.classList.remove('active');
          carouselItemWrapper.querySelectorAll('.item')[this.appendRepeat].classList.add('active');
          this.centerActiveItem(false);
        }
      } catch (error) {
        console.debug('Next item currently not accessible.');
      }
    }, this.jumpBackTimeout);
    return true;
  }

  /* select previous item in carousel */
  getPrevItem = () => {
    if (this.carouselParent.querySelectorAll('.item.active').length === 0) {
      this.carouselParent.querySelectorAll('.item')[0].classList.add('active');
    }
    const carouselItemWrapper = this.carouselParent.querySelector('.wrapper');
    const currentItem = carouselItemWrapper.querySelector('.active');
    currentItem.classList.remove('active');
    try {
      currentItem.previousSibling.classList.add('active');
    } catch (error) {
      console.debug('Previous item currently not accessible.');
    }
    this.centerActiveItem();
    /* handle frist item: jump to end after animation */
    window.setTimeout(() => {
      try {
        if (currentItem.previousSibling.classList.contains('cloned')) {
          currentItem.previousSibling.classList.remove('active');
          carouselItemWrapper.querySelectorAll('.item')[this.carouselParent.querySelectorAll('.item').length 
            - (this.appendRepeat + 1)].classList.add('active');
          this.centerActiveItem(false);
        }
      } catch (error) {
        console.debug('Previous item currently not accessible.');
      }
    }, this.jumpBackTimeout);
    return true;
  }

  initialize = () => {
    new Promise((resolve, reject) => {
      /* wrap all items in carousel */
      const carouselItemWrapper = document.createElement('div');
      carouselItemWrapper.classList.add('wrapper');
      this.carouselParent.appendChild(carouselItemWrapper);
      for (let i = this.carouselParent.querySelectorAll('.item').length - 1; i >= 0; i -= 1) {
        carouselItemWrapper.insertAdjacentElement('afterbegin', this.carouselParent.querySelectorAll('.item')[i]);
      }
      this.carouselParent.querySelectorAll('.item')[0].classList.add('active');
      resolve(carouselItemWrapper);
    }).then((carouselItemWrapper) => {
      /* add five items before and after carousel by cloning head and tail respectively */
      const carouselItemsCount = carouselItemWrapper.querySelectorAll('.item').length;
      for (let i = carouselItemsCount - 1, j = carouselItemsCount - (this.appendRepeat + 1); i > j; i -= 1) {
        const clonedItem = carouselItemWrapper.querySelectorAll('.item')[carouselItemsCount - 1].cloneNode(true);
        clonedItem.classList.remove('active');
        clonedItem.classList.add('cloned');
        clonedItem.classList.add('before');
        carouselItemWrapper.insertAdjacentElement('afterBegin', clonedItem);
      }
      for (let i = this.appendRepeat, j = (this.appendRepeat * 2); i < j; i += 1) {
        const clonedItem = carouselItemWrapper.querySelectorAll('.item')[i].cloneNode(true);
        clonedItem.classList.remove('active');
        clonedItem.classList.add('cloned');
        clonedItem.classList.add('after');
        carouselItemWrapper.insertAdjacentElement('beforeEnd', clonedItem);
      }
      /* append event handler that fires if first 5 images are loaded */
      const visibleItemImages = [];
      for (let i = 0, j = this.loadSensitivity; i < j; i += 1) {
        try {
          visibleItemImages.push(this.carouselParent.querySelectorAll('.item img')[i]);
        } catch (error) {
          console.debug(`Item ${i} has no IMG tag.`);
        }
      }
      this.unhideAfterLoading(visibleItemImages);
      return carouselItemWrapper;
    }).then((carouselItemWrapper) => {
      /* add mouse navigation to carousel */
      if (this.hasNavigation) {
        const carouselNavigation = document.createElement('div');
        carouselNavigation.classList.add('nav');
        const carouselButtonPrev = document.createElement('div');
        carouselButtonPrev.classList.add('prev');
        carouselButtonPrev.textContent = this.navigationPrevSymbol;
        carouselButtonPrev.addEventListener('click', () => {
          this.getPrevItem();
        });
        const carouselButtonNext = document.createElement('div');
        carouselButtonNext.classList.add('next');
        carouselButtonNext.textContent = this.navigationNextSymbol;
        carouselButtonNext.addEventListener('click', () => {
          this.getNextItem();
        });
        carouselNavigation.appendChild(carouselButtonPrev);
        carouselNavigation.appendChild(carouselButtonNext);
        this.carouselParent.appendChild(carouselNavigation);
      }
      /* add touch navigation to carousel */
      if (this.hasTouch) {
        this.carouselParent.addEventListener('touchstart', (event) => {
          this.touchRecordPosition(event);
        }, { passive: true }, false);
        this.carouselParent.addEventListener('touchend', (event) => {
          this.touchRecordMove(event);
        }, { passive: true }, false);
      }
      /* align carousel after all images have been loaded; autoplay */
      window.addEventListener('load', () => {
        this.centerActiveItem();
        if(this.hasAutoplay) {
          setInterval(() => {
            this.getNextItem();
          }, this.autoplayDelay);
        }
      });
      /* update alignment after window resize (wrap in timeout to prevent bubbling) */
      let resizeTimeout = false;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.centerActiveItem(false);
        }, this.resizeRepaintTimeout);
      }, false);
      /* === */
      return carouselItemWrapper;
    }).catch((error) => {
      console.log(error);
      return Promise.reject(error);
    });
  }
}

/* sandboxing to prevent leakage of function assignments */
const SimpleCarousel = new function() {
  const defaultOptions = {
    appendRepeat: 5,
    loadSensitivity: 5,
    hasNavigation: true,
    navigationPrevSymbol: '\u25C0',
    navigationNextSymbol: '\u25B6',
    hasAutoplay: false,
    autoplayDelay: 5000,
    hasTouch: true,
    touchError: 100,
    jumpBackTimeout: 550,
    resizeRepaintTimeout: 250,
  };

  const allCarousels = [];

  this.select = (id) => {
    return allCarousels[id];
  };

  this.create = (query, options) => {
    document.addEventListener('DOMContentLoaded', () => {
      const createCarousels = document.querySelectorAll(query);
      for (let i = 0, j = createCarousels.length; i < j; i += 1) {
        const currentCarousel = new Carousel(createCarousels[i], { ...defaultOptions, ...options });
        allCarousels.push(currentCarousel);
        currentCarousel.initialize();
      }
    });
  }
}();
