class Carousel {
  constructor(carouselParent, options = { 
      fillRepeat: 5, 
      loadSensitivity: 5, 
      touchError: 100, 
      prevSymbol: '\u25C0', 
      nextSymbol: '\u25B6', 
      jumpBackTimeout: 550,
      resizeRepaintTimeout: 250
    }) {
    this.carouselParent = carouselParent;
    this.id = carouselParent.id;
    this.fillRepeat = options.fillRepeat;
    this.loadSensitivity = options.loadSensitivity;
    this.touchError = options.touchError;
    this.prevSymbol = options.prevSymbol;
    this.nextSymbol = options.nextSymbol;
    this.jumpBackTimeout = options.jumpBackTimeout;
    this.resizeRepaintTimeout = options.resizeRepaintTimeout;
    this.bounceDelay = options.bounceDelay;
    Carousel.all.push(this);
  }

  /* helper array containing all instances of class */
  static all = [];

  /* helper functions for touch events */
  static touchMoveStartX = null;
  static touchMoveStartY = null;
  touchUnifyMove = (event) => {
    return event.changedTouches ? event.changedTouches[0] : event;
  };
  touchRecordPos = (event) => {
    this.touchMoveStartX = this.touchUnifyMove(event).clientX;
    this.touchMoveStartY = this.touchUnifyMove(event).clientY;
    return true;
  };
  touchRecordMove = (event) => {
    let touchDistanceX = 0;
    let touchDistanceY = 0;
    let touchError = this.touchError;
    if (this.touchMoveStartX || this.touchMoveStartX === 0) {
      touchDistanceX = this.touchUnifyMove(event).clientX - this.touchMoveStartX;
      this.touchMoveStartX = null;
    }
    if (this.touchMoveStartY || this.touchMoveStartY === 0) {
      touchDistanceY = this.touchUnifyMove(event).clientY - this.touchMoveStartY;
      this.touchMoveStartY = null;
    }
    if (Math.sign(touchDistanceX) < 0 && touchDistanceY < touchError && touchDistanceY > (-1 * touchError)) {
      this.getNextItem();
      return true;
    }
    if (Math.sign(touchDistanceX) > 0 && touchDistanceY < touchError && touchDistanceY > (-1 * touchError)) {
      this.getPrevItem();
      return true;
    }
    return false;
  };

  /* pseudo event called when first 5 images are loaded */
  imagesLoadedEvent = (imagesArray) => {
    let visibleImagesloading = Array(imagesArray.length).fill(1);
    for (let i = 0; i < imagesArray.length; i += 1){
      imagesArray[i].addEventListener('load', () => {
        visibleImagesloading[i] = 0;
        if(visibleImagesloading.reduce((a, b) => a + b, 0) == 0) {
          this.carouselParent.classList.remove('loading');
          return true;
        }
      }, { once : true });
      if(imagesArray[i].complete) {
        imagesArray[i].load();
      }
    }
    return false;
  }

  /* helper functions to center active item in carousel */
  centerActiveItem = (animate = true) => {
    const carouselItemWrapper = this.carouselParent.querySelector('.wrapper');
    const currentItem = carouselItemWrapper.querySelector('.active');
    const currentItemOffset = this.carouselParent.offsetWidth / 2 - currentItem.offsetLeft - currentItem.offsetWidth / 2;
    /* skip transition (relevant CSS class is needed) */
    if (animate === false) {
      carouselItemWrapper.classList.add('skip-transition');
    }
    carouselItemWrapper.style.transform = 'translateX(' + parseInt(currentItemOffset) + 'px)';
    /* force paint reflow */
    void carouselItemWrapper.offsetWidth;
    if (animate === false) {
      carouselItemWrapper.classList.remove('skip-transition');
    }
    return true;
  }

  /* select next item in carousel */
  getNextItem = () => {
    if(this.carouselParent.querySelectorAll('.item.active').length == 0) {
      this.carouselParent.querySelectorAll('.item')[0].classList.add('active');
    }
    const carouselItemWrapper = this.carouselParent.querySelector('.wrapper');
    const currentItem = carouselItemWrapper.querySelector('.active');
    currentItem.classList.remove('active');
    try {
      currentItem.nextSibling.classList.add('active');;
    } catch (error) {
      console.debug('Next item currently not accessible.');
    }
    this.centerActiveItem();
    /* handle last item: jump to start after animation */
    window.setTimeout(() => {
      try {
        if (currentItem.nextSibling.classList.contains('cloned')) {
          currentItem.nextSibling.classList.remove('active');
          carouselItemWrapper.querySelectorAll('.item')[this.fillRepeat].classList.add('active');
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
    if(this.carouselParent.querySelectorAll('.item.active').length == 0) {
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
          carouselItemWrapper.querySelectorAll('.item')[this.carouselParent.querySelectorAll('.item').length - (this.fillRepeat + 1)].classList.add('active');
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
      for (let j = this.carouselParent.querySelectorAll('.item').length - 1; j >= 0; j -= 1) {
        carouselItemWrapper.insertAdjacentElement('afterbegin', this.carouselParent.querySelectorAll('.item')[j]);
      }
      this.carouselParent.querySelectorAll('.item')[0].classList.add('active');
      resolve(carouselItemWrapper);
    }).then((carouselItemWrapper) => {
      /* add five items before and after carousel by cloning head and tail respectively */
      const carouselItemsCount = carouselItemWrapper.querySelectorAll('.item').length;
      for (let i = carouselItemsCount - 1; i > carouselItemsCount - (this.fillRepeat + 1); i -= 1) {
        const clonedItem = carouselItemWrapper.querySelectorAll('.item')[carouselItemsCount - 1].cloneNode(true);
        clonedItem.classList.remove('active');
        clonedItem.classList.add('cloned');
        clonedItem.classList.add('before');
        carouselItemWrapper.insertAdjacentElement('afterBegin', clonedItem);
      }
      for (let i = this.fillRepeat; i < (this.fillRepeat * 2); i += 1) {
        const clonedItem = carouselItemWrapper.querySelectorAll('.item')[i].cloneNode(true);
        clonedItem.classList.remove('active');
        clonedItem.classList.add('cloned');
        clonedItem.classList.add('after');
        carouselItemWrapper.insertAdjacentElement('beforeEnd', clonedItem);
      }
      /* append event handler that fires if first 5 images are loaded */
      let visibleItemImages = [];
      for (let i = 0; i < this.loadSensitivity; i += 1) {
        try {
          visibleItemImages.push(this.carouselParent.querySelectorAll('.item img')[i]);
        } catch (error) {
          console.debug('Item ' + i + ' has no IMG tag.');
        }
      }
      this.imagesLoadedEvent(visibleItemImages);        
      return carouselItemWrapper;
    }).then((carouselItemWrapper) => {
      /* add mouse navigation to carousel */
      const carouselNavigation = document.createElement('div');
      carouselNavigation.classList.add('nav');
      const carouselButtonPrev = document.createElement('div');
      carouselButtonPrev.classList.add('prev');
      carouselButtonPrev.textContent = this.prevSymbol;
      carouselButtonPrev.addEventListener('click', () => {
        this.getPrevItem();
      });
      const carouselButtonNext = document.createElement('div');
      carouselButtonNext.classList.add('next');
      carouselButtonNext.textContent = this.nextSymbol;
      carouselButtonNext.addEventListener('click', () => {
        this.getNextItem();
      });
      carouselNavigation.appendChild(carouselButtonPrev);
      carouselNavigation.appendChild(carouselButtonNext);
      this.carouselParent.appendChild(carouselNavigation);
      /* add touch navigation to carousel */
      this.carouselParent.addEventListener('touchstart', (event) => {
        this.touchRecordPos(event);
      }, { passive: true }, false);
      this.carouselParent.addEventListener('touchend', (event) => {
        this.touchRecordMove(event);
      }, { passive: true }, false);
      return true;
    }).catch((error) => {
      console.log(error);
      return Promise.reject(error);
    });
  }
}

let carousels = [];

/* sandboxing to prevent leakage of function assignments */
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const allCarouselItems = document.querySelectorAll('.carousel');
    for (let i = 0; i < allCarouselItems.length; i += 1) {
      const currentCarousel = new Carousel(allCarouselItems[i]);
      carousels[currentCarousel.id] = currentCarousel;
      currentCarousel.initialize();
    }
  });

  /* align carousel after all images have been loaded */
  window.addEventListener('load', () => {
    for (const carousel of Object.values(carousels)) { 
      carousel.centerActiveItem();
    };
  });

  /* update alignment after window resize (wrap in timeout to prevent bubbling) */
  let resizeTimeout = false;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      for (const carousel of Object.values(carousels)) { 
        carousel.centerActiveItem(false);
      };
    }, this.resizeRepaintTimeout);
  }, false);
})();