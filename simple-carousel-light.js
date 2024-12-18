/**
 * simple-carousel-light
 * @version 1.3.4
 * @author Jasper Habicht
 * @license The MIT License (MIT)
 */
/* global window, document, console, setTimeout, clearTimeout, setInterval */
class Carousel {
  constructor(carouselParent, options) {
    this.carouselParent = carouselParent;
    this.hasAutoplay = options.hasAutoplay;
    this.autoplayDelay = options.autoplayDelay;
    this.resizeRepaintTimeout = options.resizeRepaintTimeout;
    Carousel.all.push(this);
  }

  /* helper array containing all instances of class */
  static all = [];

  /* helper functions to center active item in carousel */
  centerActiveItem = (animate = true) => {
    const carouselItemWrapper = this.carouselParent.querySelector('.wrapper');
    const currentItem = carouselItemWrapper.querySelector('.active');
    const currentItemOffset = this.carouselParent.offsetWidth / 2
      - currentItem.offsetLeft - currentItem.offsetWidth / 2;
    /* skip transition */
    if(animate === false) {
      carouselItemWrapper.style.transition = 'none';
    }
    carouselItemWrapper.style.transform = `translateX(${currentItemOffset}px)`;
    /* force paint reflow */
    void carouselItemWrapper.offsetWidth;
    if(animate === false) {
      carouselItemWrapper.style.transition = 'inherit';
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
    } catch(error) {
      console.debug('Previous item currently not accessible.');
    }
    this.centerActiveItem();
    /* handle frist item: jump to end after animation */
    if (currentItem.nextSibling.classList.contains('cloned')) {
      Promise.all(this.carouselParent.getAnimations({ subtree: true }).map((animation) => animation.finished)).then(() => {
        try {
          currentItem.nextSibling.classList.remove('active');
          carouselItemWrapper.querySelectorAll('.item')[0].classList.add('active');
          this.centerActiveItem(false);
        } catch(error) {
          console.debug('Previous item currently not accessible.');
        }
      });
    }
    return true;
  }

  initialize = () => {
    new Promise((resolve, reject) => {
      /* wrap all items in carousel */
      const carouselItemWrapper = document.createElement('div');
      carouselItemWrapper.classList.add('wrapper');
      carouselItemWrapper.style.transition = 'inherit';
      this.carouselParent.appendChild(carouselItemWrapper);
      for(let i = this.carouselParent.querySelectorAll('.item').length - 1; i >= 0; i -= 1) {
        carouselItemWrapper.insertAdjacentElement('afterbegin', this.carouselParent.querySelectorAll('.item')[i]);
      }
      this.carouselParent.querySelectorAll('.item')[0].classList.add('active');
      resolve(carouselItemWrapper);
    }).then((carouselItemWrapper) => {
      /* add first items after carousel by cloning head */
      const clonedItemAfter = carouselItemWrapper.querySelectorAll('.item')[0].cloneNode(true);
      clonedItemAfter.classList.remove('active');
      clonedItemAfter.classList.add('cloned');
      clonedItemAfter.classList.add('after');
      carouselItemWrapper.insertAdjacentElement('beforeEnd', clonedItemAfter);
      return carouselItemWrapper;
    }).then((carouselItemWrapper) => {
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
    hasAutoplay: false,
    autoplayDelay: 5000,
    resizeRepaintTimeout: 250,
  };

  this.create = (query, options) => {
    document.addEventListener('DOMContentLoaded', () => {
      const createCarousels = document.querySelectorAll(query);
      for(let i = 0, j = createCarousels.length; i < j; i += 1) {
        const currentAnimationDuration = parseInt(window.getComputedStyle(createCarousels[i]).getPropertyValue('transition-duration')) 
          || defaultOptions.animationDuration;
        const currentCarousel = new Carousel(createCarousels[i], { ...defaultOptions, animationDuration: currentAnimationDuration, ...options });
        currentCarousel.initialize();
      }
    });
  }
}();
